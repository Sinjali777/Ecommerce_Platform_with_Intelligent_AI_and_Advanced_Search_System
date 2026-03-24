# ============================================================
# app.py — Laptop AI Assistant (RAG + Groq LLM)
# ============================================================

import os
import json
import glob
import numpy as np
import pandas as pd
import streamlit as st
import kagglehub
from groq import Groq
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

# ============================================================
# 1. PAGE CONFIG
# ============================================================
st.set_page_config(
    page_title="💻 Laptop AI Assistant",
    page_icon="💻",
    layout="wide"
)

# ============================================================
# 2. LOAD DATASET
# ============================================================
@st.cache_data
def load_data():
    path      = kagglehub.dataset_download(
                    "anshsahu111/laptop-specifications-and-prices-dataset")
    csv_files = glob.glob(f"{path}/*.csv")

    # Use cleaned version
    cleaned   = [f for f in csv_files if 'cleaned' in f]
    target    = cleaned[0] if cleaned else csv_files[0]

    df = pd.read_csv(target)

    # ── Fix column name typos from dataset ──────────────────
    df.rename(columns={
        'resolutioin_height' : 'resolution_height',
        'resolutioin_width'  : 'resolution_width',
        'warrenty'           : 'warranty',
        'iter'               : 'processor_tier',
    }, inplace=True)

    # ── Fill nulls ───────────────────────────────────────────
    df['threads_num'] = df['threads_num'].fillna(0).astype(int)
    df['core_num']    = df['core_num'].fillna(0).astype(int)
    df['rating']      = df['rating'].fillna(0.0)

    # ── Price: dataset uses INR, convert to USD ──────────────
    df['price_inr'] = df['price']
    df['price_usd'] = (df['price'] / 83).round(0).astype(int)

    # ── Build resolution string ──────────────────────────────
    df['resolution'] = (df['resolution_height'].astype(str) +
                        'x' + df['resolution_width'].astype(str))

    # ── Build use_case tags from specs ──────────────────────
    def infer_use_case(row):
        tags = []
        ram  = row['ram_num']
        gpu  = str(row['gpu_type']).lower()
        tier = str(row['processor_tier']).lower()

        if 'dedicated' in gpu or 'discrete' in gpu:
            tags.append('gaming')
            tags.append('video editing')
        if ram >= 16:
            tags.append('video editing')
            tags.append('programming')
            tags.append('multitasking')
        if ram <= 8:
            tags.append('student')
            tags.append('office')
        if 'i9' in tier or 'ryzen 9' in tier:
            tags.append('high performance')
            tags.append('3D rendering')
        if 'i5' in tier or 'ryzen 5' in tier:
            tags.append('student')
            tags.append('everyday use')
        if 'i7' in tier or 'ryzen 7' in tier:
            tags.append('programming')
            tags.append('content creation')
        if not tags:
            tags.append('general use')
        return ', '.join(set(tags))

    df['use_case'] = df.apply(infer_use_case, axis=1)

    # ── Build full text for SBERT embedding ─────────────────
    df['full_text'] = df.apply(lambda r: (
        f"{r['brand_name']} {r['model']} "
        f"processor {r['processor']} "
        f"{r['ram']} RAM "
        f"{r['memory_size']}GB {r['memory_type']} storage "
        f"{r['gpu_brand']} {r['gpu_type']} GPU "
        f"{r['display_size']} inch {r['resolution']} display "
        f"price ${r['price_usd']} "
        f"use case: {r['use_case']}"
    ), axis=1)

    return df


# ============================================================
# 3. LOAD SBERT EMBEDDER
# ============================================================
@st.cache_resource
def load_embedder():
    return SentenceTransformer('all-MiniLM-L6-v2')


# ============================================================
# 4. BUILD SBERT EMBEDDINGS
# ============================================================
@st.cache_data
def build_embeddings(_df):
    embedder = load_embedder()
    return embedder.encode(_df['full_text'].tolist(), show_progress_bar=False)


# ============================================================
# 5. GROQ CLIENT
# ============================================================
@st.cache_resource
def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        st.error("❌ GROQ_API_KEY not found in .env file!")
        st.stop()
    return Groq(api_key=api_key)


# ============================================================
# 6. EXTRACT FILTERS FROM QUERY USING LLM
# ============================================================
def extract_filters(query, client):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "system",
            "content": """You are a laptop filter extractor.
Extract search filters from the user query and return ONLY
a valid JSON object with these exact fields (use null if not mentioned):
{
  "max_price_usd"   : number or null,
  "min_price_usd"   : number or null,
  "min_ram_gb"      : number or null,
  "brand"           : string or null,
  "gpu_type"        : "dedicated" or "integrated" or null,
  "processor_brand" : "Intel" or "AMD" or null,
  "use_case"        : string or null,
  "min_storage_gb"  : number or null,
  "min_display_inch": number or null,
  "touch_screen"    : true or false or null,
  "max_price_usd"   : number or null
}
Return ONLY the JSON. No explanation. No markdown.
If user mentions a game like RDR2, GTA, Cyberpunk etc,
set gpu_type to dedicated and min_ram_gb to at least 16."""
        }, {
            "role": "user",
            "content": query
        }],
        temperature=0.1,
        max_tokens=300
    )

    try:
        raw = response.choices[0].message.content.strip()
        # Clean any markdown if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except:
        return {}


# ============================================================
# 7. FILTER DATAFRAME BY EXTRACTED FILTERS
# ============================================================
def filter_laptops(df, filters):
    result = df.copy()

    if filters.get('max_price_usd'):
        result = result[result['price_usd'] <= filters['max_price_usd']]

    if filters.get('min_price_usd'):
        result = result[result['price_usd'] >= filters['min_price_usd']]

    if filters.get('min_ram_gb'):
        result = result[result['ram_num'] >= filters['min_ram_gb']]

    if filters.get('brand'):
        result = result[
            result['brand_name'].str.contains(
                filters['brand'], case=False, na=False)]

    if filters.get('gpu_type'):
        result = result[
            result['gpu_type'].str.contains(
                filters['gpu_type'], case=False, na=False)]

    if filters.get('processor_brand'):
        result = result[
            result['processor_brand'].str.contains(
                filters['processor_brand'], case=False, na=False)]

    if filters.get('min_storage_gb'):
        result = result[result['memory_size'] >= filters['min_storage_gb']]

    if filters.get('min_display_inch'):
        result = result[result['display_size'] >= filters['min_display_inch']]

    if filters.get('touch_screen') is True:
        result = result[result['Touch_Screen'] == True]

    return result


# ============================================================
# 8. SEMANTIC RERANKING WITH SBERT
# ============================================================
def semantic_rerank(query, filtered_df, embeddings, all_df, top_k=5):
    if filtered_df.empty:
        return filtered_df

    embedder = load_embedder()

    # Get indices of filtered rows in original df
    filtered_idx = filtered_df.index.tolist()

    # Get their embeddings
    filtered_embs = embeddings[filtered_idx]

    # Encode query
    query_emb = embedder.encode([query])

    # Cosine similarity
    scores    = cosine_similarity(query_emb, filtered_embs)[0]

    # Get top_k
    top_k     = min(top_k, len(filtered_df))
    top_idx   = scores.argsort()[::-1][:top_k]

    result    = filtered_df.iloc[top_idx].copy()
    result['match_score'] = scores[top_idx].round(3)

    return result


# ============================================================
# 9. BUILD CONTEXT STRING FOR LLM
# ============================================================
def build_context(laptops_df):
    if laptops_df.empty:
        return "No laptops found matching the criteria."

    context = ""
    for i, (_, row) in enumerate(laptops_df.iterrows(), 1):
        context += f"""
Laptop {i}: {row['brand_name']} {row['model']}
  Price       : ₹{row['price_inr']:,} (~${row['price_usd']})
  Processor   : {row['processor']}
  Cores/Threads: {int(row['core_num'])} cores / {int(row['threads_num'])} threads
  RAM         : {row['ram']}
  Storage     : {row['memory_size']}GB {row['memory_type']}
  GPU         : {row['gpu_brand']} {row['gpu_type']}
  Display     : {row['display_size']}" {row['resolution']}
  OS          : {row['os']}
  Touch Screen: {row['Touch_Screen']}
  Warranty    : {row['warranty']} year(s)
  Rating      : {row['rating']}/5
  Best For    : {row['use_case']}
  Match Score : {row.get('match_score', 'N/A')}
"""
    return context


# ============================================================
# 10. GENERATE LLM RESPONSE
# ============================================================
def generate_response(user_query, laptop_context,
                       chat_history, client, filters):
    system_prompt = f"""
You are LaptopBot, an expert AI laptop shopping assistant.
You have deep knowledge of laptop specifications and can:
- Recommend the best laptops for specific use cases
- Compare laptops side by side
- Explain technical specs in simple language
- Understand gaming requirements (you know popular games and their GPU/RAM needs)
- Help users find laptops within their budget

FILTERS EXTRACTED FROM QUERY:
{json.dumps(filters, indent=2)}

MATCHING LAPTOPS FROM DATABASE:
{laptop_context}

RULES:
- Only recommend laptops from the catalog above
- Always mention price in both INR and USD
- When user asks about gaming, mention if GPU is dedicated or integrated
- Explain specs clearly for non-technical users
- If comparing, use a clear structured format
- Be conversational and helpful
- If no laptops match, say so honestly and suggest relaxing filters
- Keep responses clear and well structured
    """

    MAX_HISTORY = 6
    recent      = [m for m in chat_history[-MAX_HISTORY:]
                   if m["role"] != "system"]

    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            *recent,
            {"role": "user",   "content": user_query}
        ],
        temperature=0.4,
        max_tokens=600,
        stream=True
    )
    return stream


# ============================================================
# 11. MAIN APP
# ============================================================

# Load everything
with st.spinner("⏳ Loading dataset and models..."):
    df         = load_data()
    embedder   = load_embedder()
    embeddings = build_embeddings(df)
    client     = get_groq_client()

# ── Header ────────────────────────────────────────────────────
st.title("💻 Laptop AI Shopping Assistant")
st.caption("Ask me anything — search, compare, explain specs, recommend!")

# ── Sidebar Stats ─────────────────────────────────────────────
with st.sidebar:
    st.header("📊 Database Stats")
    st.metric("Total Laptops",   f"{len(df):,}")
    st.metric("Brands",          df['brand_name'].nunique())
    st.metric("Price Range",     f"₹{df['price_inr'].min():,} – ₹{df['price_inr'].max():,}")
    st.metric("Avg Rating",      f"{df['rating'].mean():.1f} / 5")

    st.divider()
    st.header("💡 Try Asking")
    examples = [
        "Best laptop under $600 for gaming",
        "Compare ASUS vs Lenovo laptops",
        "Laptop that can run RDR2 smoothly",
        "Best laptop for video editing with 16GB RAM",
        "Cheap laptop for students under $400",
        "Laptop with dedicated GPU and 1TB storage",
    ]
    for ex in examples:
        if st.button(ex, use_container_width=True):
            st.session_state['prefill'] = ex

    st.divider()
    st.header("⚙️ Settings")
    show_filters = st.toggle("Show extracted filters", value=True)
    show_matches = st.toggle("Show matched laptops",   value=True)

# ── Chat History ──────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.messages.append({
        "role"   : "assistant",
        "content": (
            "Hi! I'm LaptopBot 💻\n\n"
            "Tell me what you need — budget, use case, "
            "specs, or even a game you want to play — "
            "and I'll find the best laptops for you!\n\n"
            "Try: *'best laptop under $700 for gaming and video editing'*"
        )
    })

for msg in st.session_state.messages:
    if msg["role"] != "system":
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

# ── Chat Input ────────────────────────────────────────────────
prefill = st.session_state.pop('prefill', '')
prompt  = st.chat_input(
    "e.g. best laptop under $800 to play RDR2 and do video editing...")

# Handle sidebar button prefill
if prefill and not prompt:
    prompt = prefill

if prompt:
    # Show user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):

        # ── Step 1: Extract filters ───────────────────────────
        with st.spinner("🔍 Understanding your query..."):
            filters = extract_filters(prompt, client)

        if show_filters and filters:
            with st.expander("🎯 Extracted Filters", expanded=False):
                st.json(filters)

        # ── Step 2: Filter database ───────────────────────────
        with st.spinner("📦 Searching laptop database..."):
            filtered_df = filter_laptops(df, filters)

        # ── Step 3: Semantic rerank ───────────────────────────
        with st.spinner("⚡ Ranking best matches..."):
            ranked_df = semantic_rerank(
                prompt, filtered_df, embeddings, df, top_k=5)

        # ── Show matched laptops table ────────────────────────
        if show_matches and not ranked_df.empty:
            with st.expander(
                f"📋 Top {len(ranked_df)} Matching Laptops", expanded=False):
                display_cols = [
                    'brand_name', 'model', 'price_usd',
                    'ram', 'memory_size', 'gpu_type',
                    'processor', 'rating', 'match_score'
                ]
                st.dataframe(
                    ranked_df[display_cols].reset_index(drop=True),
                    use_container_width=True
                )

        if filtered_df.empty:
            st.warning(
                f"⚠️ No laptops matched your filters. "
                f"Try relaxing your requirements.")

        # ── Step 4: Build context ─────────────────────────────
        laptop_context = build_context(ranked_df)

        # ── Step 5: Generate & stream response ───────────────
        message_placeholder = st.empty()
        full_response       = ""

        stream = generate_response(
            prompt,
            laptop_context,
            st.session_state.messages,
            client,
            filters
        )

        for chunk in stream:
            delta         = chunk.choices[0].delta.content or ""
            full_response += delta
            message_placeholder.markdown(full_response + "▌")

        message_placeholder.markdown(full_response)

    # Save response
    st.session_state.messages.append({
        "role"   : "assistant",
        "content": full_response
    })