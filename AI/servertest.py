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

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'Backend', 'laptops_cleaned_v1_final.csv')
if not os.path.exists(CSV_PATH):
    CSV_PATH = os.path.join(os.path.dirname(__file__), 'laptops_cleaned_v1_final.csv')

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

# ── NEW: LLM-Based Intent Detection ──────────────────────────
def check_intent_with_llm(message: str) -> bool:
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": """You are an ELIMINATION gatekeeper. 
                Your default answer is 'NO'.
                
                You only say 'YES' if the user:
                1. Names a specific laptop brand or model.
                2. Mentions a budget (e.g., 'under 80k', '1 lakh').
                3. Asks for a recommendation for a task (e.g., 'for coding', 'for school').
                4. Asks to 'see' or 'list' products.
                
                You MUST say 'NO' if the user:
                - Just says 'Hi', 'Hello', 'Hey'.
                - Asks how you are or who you are.
                - Asks a general knowledge question (e.g., 'What is RAM?', 'Who is Elon Musk?').
                - Complains or talks about non-laptop topics.
                
                Return ONLY 'YES' or 'NO'."""
            }, {
                "role": "user",
                "content": message
            }],
            temperature=0, # This must be 0 for consistency
            max_tokens=5
        )
        verdict = response.choices[0].message.content.strip().upper()
        
        # We only return True if the ONLY word in the response is YES
        return "YES" in verdict and "NO" not in verdict
    except:
        return False

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
(Mapping rules for brands and use-cases remain same)
Return ONLY the JSON. No explanation."""
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
        result = result[result['brand_name'].str.contains(filters['brand'], case=False, na=False)]
    if filters.get('gpu_type'):
        result = result[result['gpu_type'].str.contains(filters['gpu_type'], case=False, na=False)]
    if filters.get('processor_brand'):
        result = result[result['processor_brand'].str.contains(filters['processor_brand'], case=False, na=False)]
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

    # NEW: Using LLM to decide if we should search the CSV
    do_search = check_intent_with_llm(req.message)

    filters          = {}
    matched_products = []
    laptop_context   = ""

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

    if do_search and laptop_context:
        system_prompt = f"""
You are LaptopKinneHainaTa AI, a friendly laptop expert in Nepal.
DETECTED FILTERS: {json.dumps(filters, indent=2)}
MATCHING LAPTOPS:
{laptop_context}
(Rules: Recommend from the data above, prices in NPR, be warm and conversational.)
"""
    else:
        system_prompt = "You are LaptopKinneHainaTa AI, a friendly laptop shopping assistant for LaptopKinneHainaTa in Nepal. Guide the user to tell you their budget or needs."

    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.4,
        max_tokens=400
    )

    return {
        "response":         response.choices[0].message.content,
        "intent":           filters.get('use_case') if do_search else None,
        "filters":          filters,
        "matched_products": matched_products,
        "session_id":       req.session_id,
        "search_triggered": do_search
    }

# (Compare, Recommend, Health Check, and Run blocks remain exactly same as your original)
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
    context = f"Compare {a['model']} and {b['model']}..."
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": "You are a laptop expert."}, {"role": "user", "content": context}],
        temperature=0.4
    )
    return {"comparison": response.choices[0].message.content, "laptop_a": a['model'], "laptop_b": b['model']}

@app.post("/recommend")
async def recommend(req: dict):
    use_case = req.get("use_case", "general")
    max_budget = req.get("max_budget", 200000)
    query = f"{use_case} budget {max_budget}"
    query_emb = embedder.encode([query])
    scores = cosine_similarity(query_emb, embeddings)[0]
    top_idx = scores.argsort()[::-1][:3]
    top_laptops = df.iloc[top_idx]
    return {"recommendation": "Check these out...", "matched_products": top_laptops.to_dict('records')}

@app.get("/")
async def root():
    return {"message": "NLP Service is running!", "dataset": f"{len(df)} laptops loaded"}

if __name__ == "__main__":
    uvicorn.run("nlp_server:app", host="0.0.0.0", port=8000, reload=True)