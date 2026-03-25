# nlp_server.py
import os
import json
import glob
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv
from transformers import logging as hf_logging
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn

# Suppress warnings
hf_logging.set_verbosity_error()
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Models ────────────────────────────────────────────
class ChatMessage(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    message:    str
    session_id: Optional[str] = "default"
    history:    Optional[List[ChatMessage]] = []

# ── Load YOUR CSV directly ────────────────────────────────────
print("⏳ Loading dataset...")

# Path to your own CSV in backend folder
CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    '..', 'Backend', 'laptops_cleaned_v1_final.csv'
)

# Fallback — try current directory
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(os.path.dirname(__file__), 'laptops_cleaned_v1_final.csv')

# Fallback — search nearby
if not os.path.exists(CSV_PATH):
    for root, dirs, files in os.walk(os.path.expanduser('~')):
        for f in files:
            if f == 'laptops_cleaned_v1_final.csv':
                CSV_PATH = os.path.join(root, f)
                break
        if os.path.exists(CSV_PATH):
            break

print(f"📂 Using CSV: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"✅ Loaded {len(df)} laptops")

# ── Fix column names ──────────────────────────────────────────
df.rename(columns={
    'resolutioin_height': 'resolution_height',
    'resolutioin_width':  'resolution_width',
    'warrenty':           'warranty',
    'iter':               'processor_tier',
}, inplace=True)

df['threads_num'] = df['threads_num'].fillna(0).astype(int)
df['core_num']    = df['core_num'].fillna(0).astype(int)
df['rating']      = df['rating'].fillna(0.0)

# NPR conversion (1 INR = 1.6 NPR)
df['price_inr'] = df['price']
df['price_npr'] = (df['price'] * 1.6).round(0).astype(int)

df['resolution'] = (
    df['resolution_height'].astype(str) + 'x' +
    df['resolution_width'].astype(str)
)

def infer_use_case(row):
    tags = []
    ram  = row['ram_num']
    gpu  = str(row['gpu_type']).lower()
    tier = str(row['processor_tier']).lower()
    if 'dedicated' in gpu or 'discrete' in gpu:
        tags += ['gaming', 'video editing']
    if ram >= 16:
        tags += ['video editing', 'programming', 'multitasking']
    if ram <= 8:
        tags += ['student', 'office']
    if 'i7' in tier or 'ryzen 7' in tier:
        tags += ['programming', 'content creation']
    if 'i5' in tier or 'ryzen 5' in tier:
        tags += ['student', 'everyday use']
    if not tags:
        tags = ['general use']
    return ', '.join(set(tags))

df['use_case'] = df.apply(infer_use_case, axis=1)

df['full_text'] = df.apply(lambda r: (
    f"{r['brand_name']} {r['model']} "
    f"processor {r['processor']} "
    f"{r['ram']} RAM "
    f"{r['memory_size']}GB {r['memory_type']} storage "
    f"{r['gpu_brand']} {r['gpu_type']} GPU "
    f"{r['display_size']} inch {r['resolution']} display "
    f"price Rs.{r['price_npr']} "
    f"use case: {r['use_case']}"
), axis=1)

# ── Load SBERT ────────────────────────────────────────────────
print("⏳ Loading SBERT embedder...")
embedder   = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = embedder.encode(
    df['full_text'].tolist(),
    show_progress_bar=False
)

# ── Groq client ───────────────────────────────────────────────
print("⏳ Connecting to Groq...")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print("✅ NLP Server ready!")

# ── LLM-Based Intent Classifier (replaces keyword approach) ───
def needs_product_search(message: str) -> bool:
    """
    Uses an LLM to determine whether the user's message implies
    product search intent (finding, comparing, or pricing laptops).
    Returns True for product-related queries, False for general chat.
    """
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an intent classifier for a Nepal-based laptop store chatbot.\n"
                    "Your only job is to decide if the user's message requires searching "
                    "a laptop database.\n\n"
                    "Reply with YES if the message involves ANY of:\n"
                    "- Looking for, finding, or buying a laptop or computer\n"
                    "- Asking about specs, price, or availability of a device\n"
                    "- Comparing two laptops or models\n"
                    "- Mentioning a use case that implies needing a laptop "
                    "  (e.g. gaming, coding, schoolwork, video editing, office work)\n"
                    "- Mentioning a brand that sells laptops "
                    "  (e.g. Apple, HP, Asus, Lenovo, Acer, Dell, MSI)\n"
                    "- Asking for a recommendation or suggestion for a machine/device\n\n"
                    "Reply with NO if the message is:\n"
                    "- A greeting or small talk (hi, hello, how are you)\n"
                    "- A general question unrelated to laptops or computers\n"
                    "- A thank you or farewell\n\n"
                    "EXAMPLES:\n"
                    "  'I need a machine for my kids to do schoolwork' → YES\n"
                    "  'something powerful for gaming under 1 lakh' → YES\n"
                    "  'show me a mac' → YES\n"
                    "  'which is better for video editing?' → YES\n"
                    "  'hello, how are you?' → NO\n"
                    "  'what is RAM?' → NO\n"
                    "  'thanks, bye!' → NO\n\n"
                    "Respond with ONLY the single word YES or NO. No explanation."
                )
            },
            {
                "role": "user",
                "content": message
            }
        ],
        temperature=0.0,
        max_tokens=5,
    )

    verdict = response.choices[0].message.content.strip().upper()
    return verdict.startswith("YES")


# ── Helper Functions ──────────────────────────────────────────
def extract_filters(query: str) -> dict:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "system",
            "content": """Extract laptop search filters from the user query.
Return ONLY a valid JSON object:
{
  "max_price_npr"   : number or null,
  "min_price_npr"   : number or null,
  "min_ram_gb"      : number or null,
  "brand"           : string or null,
  "gpu_type"        : "dedicated" or "integrated" or null,
  "processor_brand" : "Intel" or "AMD" or null,
  "use_case"        : string or null,
  "min_storage_gb"  : number or null
}

BRAND MAPPING (very important):
- "mac", "macbook", "apple laptop", "apple" → brand: "Apple"
- "rog", "tuf", "vivobook", "zenbook" → brand: "Asus"
- "thinkpad", "ideapad", "legion", "yoga" → brand: "Lenovo"
- "pavilion", "envy", "victus", "spectre" → brand: "HP"
- "nitro", "aspire", "swift" → brand: "Acer"

PRICE HINTS:
- "1 lakh" = 100000 NPR
- "80k" = 80000 NPR
- "$800" ≈ 107000 NPR

GAME REQUIREMENTS:
- RDR2, GTA 5, Cyberpunk, Valorant → gpu_type: "dedicated", min_ram_gb: 16
- Minecraft, Roblox → min_ram_gb: 8

USE CASE MAPPING:
- "college", "school", "studying" → use_case: "student"
- "code", "dev", "developer" → use_case: "programming"
- "edit", "premiere", "davinci" → use_case: "video editing"
- "play games", "gaming" → use_case: "gaming"

Return ONLY the JSON. No explanation. No markdown."""
        }, {
            "role": "user",
            "content": query
        }],
        temperature=0.1,
        max_tokens=300
    )
    try:
        raw = response.choices[0].message.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)
    except:
        return {}


def filter_laptops(filters: dict):
    result = df.copy()
    if filters.get('max_price_npr'):
        result = result[result['price_npr'] <= filters['max_price_npr']]
    if filters.get('min_price_npr'):
        result = result[result['price_npr'] >= filters['min_price_npr']]
    if filters.get('min_ram_gb'):
        result = result[result['ram_num'] >= filters['min_ram_gb']]
    if filters.get('brand'):
        result = result[result['brand_name'].str.contains(
            filters['brand'], case=False, na=False)]
    if filters.get('gpu_type'):
        result = result[result['gpu_type'].str.contains(
            filters['gpu_type'], case=False, na=False)]
    if filters.get('processor_brand'):
        result = result[result['processor_brand'].str.contains(
            filters['processor_brand'], case=False, na=False)]
    if filters.get('min_storage_gb'):
        result = result[result['memory_size'] >= filters['min_storage_gb']]
    return result


def semantic_rerank(query: str, filtered_df, top_k: int = 5):
    if filtered_df.empty:
        return filtered_df
    filtered_idx  = filtered_df.index.tolist()
    filtered_embs = embeddings[filtered_idx]
    query_emb     = embedder.encode([query])
    scores        = cosine_similarity(query_emb, filtered_embs)[0]
    top_k         = min(top_k, len(filtered_df))
    top_idx       = scores.argsort()[::-1][:top_k]
    result        = filtered_df.iloc[top_idx].copy()
    result['match_score'] = scores[top_idx].round(3)
    return result


def build_context(laptops_df) -> str:
    if laptops_df.empty:
        return "No laptops found matching the criteria."
    context = ""
    for i, (_, row) in enumerate(laptops_df.iterrows(), 1):
        context += f"""
Laptop {i}: {row['brand_name']} {row['model']}
  Price      : Rs.{row['price_npr']:,} (NPR)
  Processor  : {row['processor']}
  RAM        : {row['ram']}
  Storage    : {row['memory_size']}GB {row['memory_type']}
  GPU        : {row['gpu_brand']} {row['gpu_type']}
  Display    : {row['display_size']}" {row['resolution']}
  Rating     : {row['rating']}/5
  Best For   : {row['use_case']}
"""
    return context


# ── Chat Endpoint ─────────────────────────────────────────────
@app.post("/chat")
async def chat(req: ChatRequest):

    do_search = needs_product_search(req.message)   # ← LLM-based classifier

    filters          = {}
    matched_products = []
    laptop_context   = ""

    # Only search if message is product-related
    if do_search:
        filters     = extract_filters(req.message)
        filtered_df = filter_laptops(filters)
        ranked_df   = semantic_rerank(req.message, filtered_df, top_k=5)
        laptop_context = build_context(ranked_df)

        if not ranked_df.empty:
            for _, row in ranked_df.iterrows():
                matched_products.append({
                   "product_name":  f"{row['brand_name']} {row['model']}",
                    "brand":         str(row['brand_name']),
                    "price_npr":     float(row['price_npr']),
                    "match_score":   float(row.get('match_score', 0)),
                    "rating":        float(row['rating']),
            "ram_gb":        int(row['ram_num']),
            "storage_gb":    int(row['memory_size']),
            "gpu_type":      str(row['gpu_type']),
            "processor":     str(row['processor']),
            "display_size":  float(row['display_size']),
                })

   # Build system prompt
    if do_search and laptop_context:
        system_prompt = f"""
You are LaptopKinneHainaTa AI, a friendly and knowledgeable laptop shopping
assistant for a Nepal-based electronics store. All prices are in NPR.

IMPORTANT BEHAVIOR RULES:
- You have a database of laptops. ALWAYS refer to it.
- If matched laptops include the brand/model user asked about, recommend them.
- NEVER say "we don't have X" if the database shows X laptops.
- Be flexible with names: "mac", "macbook", "apple laptop" all mean Apple MacBook.
- If user says "mac" and database has MacBooks, recommend those MacBooks.
- Match user intent intelligently — "something powerful" means high-end specs.
- Prices are in NPR. 1 lakh = 100,000 NPR.

DETECTED FILTERS: {json.dumps(filters, indent=2)}

MATCHING LAPTOPS FROM OUR DATABASE:
{laptop_context}

RESPONSE RULES:
- Recommend from the laptops shown above
- Always mention: name, price in Rs., key specs, why it fits
- If user asked to compare, compare the top 2 laptops side by side
- Use simple language, avoid jargon unless user seems technical
- Be conversational and warm — like a helpful shop assistant
- Keep response under 250 words
- If user's exact request isn't available, suggest closest alternative
        """
    else:
        system_prompt = """
You are LaptopKinneHainaTa AI, a friendly laptop shopping assistant
for LaptopKinneHainaTa — a Nepal-based laptop electronics store.

PERSONALITY:
- Warm, helpful, knowledgeable
- Like a knowledgeable friend who knows laptops well
- Flexible and understanding with how users phrase things

YOU CAN HELP WITH:
- Finding laptops by budget, brand, use case, or specs
- Comparing laptops side by side
- Explaining what specs mean in plain language
- Recommending based on lifestyle and needs
- Answering general laptop questions

IMPORTANT:
- We stock: Asus, HP, Lenovo, Acer, Apple (MacBook) laptops
- All prices are in NPR (Nepali Rupees)
- If someone says "mac" or "apple laptop" we have MacBooks
- Guide users to tell you their budget and use case
- Be encouraging and helpful, never dismissive
        """
    # Build messages with history
    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    # Generate response
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.4,
        max_tokens=400
    )

    answer = response.choices[0].message.content

    return {
        "response":         answer,
        "intent":           filters.get('use_case') if do_search else None,
        "filters":          filters,
        "matched_products": matched_products,
        "session_id":       req.session_id,
        "search_triggered": do_search
    }


# ── Compare Endpoint ──────────────────────────────────────────
@app.post("/compare")
async def compare_laptops(req: dict):
    laptop_a = req.get("laptop_a", "")
    laptop_b = req.get("laptop_b", "")

    def find_laptop(query):
        q_emb  = embedder.encode([query])
        scores = cosine_similarity(q_emb, embeddings)[0]
        best   = scores.argmax()
        return df.iloc[best]

    a = find_laptop(laptop_a)
    b = find_laptop(laptop_b)

    context = f"""
Compare these two laptops:

Laptop A: {a['brand_name']} {a['model']}
  Price    : Rs.{a['price_npr']:,}
  Processor: {a['processor']}
  RAM      : {a['ram']}
  Storage  : {a['memory_size']}GB {a['memory_type']}
  GPU      : {a['gpu_brand']} {a['gpu_type']}
  Rating   : {a['rating']}/5

Laptop B: {b['brand_name']} {b['model']}
  Price    : Rs.{b['price_npr']:,}
  Processor: {b['processor']}
  RAM      : {b['ram']}
  Storage  : {b['memory_size']}GB {b['memory_type']}
  GPU      : {b['gpu_brand']} {b['gpu_type']}
  Rating   : {b['rating']}/5
"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
           {"role": "system", "content":
            """You are a laptop expert for Nepal.
            Compare the two laptops using this EXACT format:

            Laptop A: [name]
            Laptop B: [name]

            Processor: [A processor] | [B processor]
            RAM: [A ram] | [B ram]
            Storage: [A storage] | [B storage]
            GPU: [A gpu] | [B gpu]
            Rating: [A rating]/5 | [B rating]/5

            [2-3 sentences comparing overall value]

            Winner: [which is better and why in one sentence]"""},
            {"role": "user", "content": context}
        ],
        temperature=0.4,
        max_tokens=400
    )

    return {
        "comparison": response.choices[0].message.content,
        "laptop_a":   {"name": f"{a['brand_name']} {a['model']}", "price_npr": float(a['price_npr'])},
        "laptop_b":   {"name": f"{b['brand_name']} {b['model']}", "price_npr": float(b['price_npr'])},
    }


# ── Recommend Endpoint ────────────────────────────────────────
@app.post("/recommend")
async def recommend(req: dict):
    use_case    = req.get("use_case",    "general")
    max_budget  = req.get("max_budget",  200000)
    preferences = req.get("preferences", "")

    filtered = df[df['price_npr'] <= max_budget].copy()

    if use_case and use_case != "general":
        mask = filtered['full_text'].str.contains(
            use_case, case=False, na=False)
        if mask.sum() > 0:
            filtered = filtered[mask]

    if filtered.empty:
        filtered = df[df['price_npr'] <= max_budget].copy()

    query     = f"{use_case} {preferences} budget {max_budget} NPR"
    query_emb = embedder.encode([query])
    idx       = filtered.index.tolist()
    embs      = embeddings[idx]
    scores    = cosine_similarity(query_emb, embs)[0]
    top_idx   = scores.argsort()[::-1][:5]
    top_laptops = filtered.iloc[top_idx]
    context   = build_context(top_laptops)

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content":
             "You are a laptop shopping expert for Nepal. "
             "Recommend the best laptop from the list. "
             "Explain why it fits the user's needs. All prices in NPR."},
            {"role": "user", "content":
             f"Use case: {use_case}\nBudget: Rs.{max_budget:,}\n"
             f"Preferences: {preferences}\n\n{context}"}
        ],
        temperature=0.4,
        max_tokens=400
    )

    products_out = []
    for i, (_, row) in enumerate(top_laptops.iterrows()):
        products_out.append({
            "product_name": f"{row['brand_name']} {row['model']}",
            "price_npr":    float(row['price_npr']),
            "rating":       float(row['rating']),
            "match_score":  float(scores[top_idx[i]]) if i < len(top_idx) else 0.0
        })

    return {
        "recommendation":  response.choices[0].message.content,
        "matched_products": products_out,
        "session_id":      req.get("session_id", "default")
    }


# ── Health Check ──────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message":   "NLP Service is running!",
        "dataset":   f"{len(df)} laptops loaded",
        "endpoints": ["POST /chat", "POST /compare", "POST /recommend"]
    }


# ── Run ───────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "nlp_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )