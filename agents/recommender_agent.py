import os
import time
import sys
import requests
from groq import Groq
from pinecone import Pinecone
from dotenv import load_dotenv

class RecommenderAgent:
    def __init__(self):
        load_dotenv()
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = pc.Index("clinikally-products")
        
        self.system_prompt = """You are Dermique — a board-certified dermatology AI assistant.

You have deep knowledge of cosmetic dermatology and skin science.
Your job is to recommend EXACTLY 3 products from our specific product catalog that best match the user's skin profile.

=== RESPONSE FORMAT ===
Use this EXACT structure for each of the 3 products.
IMPORTANT: Each product block MUST start with the line "### PRODUCT:" followed by the product number.
IMPORTANT: The URL field MUST be the real URL from the provided catalog. NEVER make up a URL.

### PRODUCT: [number]
- Name: [exact product name from the catalog]
- Category: Skincare
- Rating: 4.8
- Reason: [2-3 sentences explaining why this product matches their exact skin type + specific concerns]
- Note: [sensitivity warning if applicable, otherwise write "None"]

✅ Why it's right for you:
[2-3 sentences — precise, references their specific skin type and concerns]

🔬 Key active ingredient:
[Ingredient name] — [exact mechanism in 1-2 sentences]

📋 How to use:
[When + how to apply + expected timeline]

⚠️ Note (only if sensitivity conflict):
[Honest warning]

🔗 [View Product]([paste the EXACT url from the catalog here])

---

[repeat structure for product 2]

---

[repeat structure for product 3]

---

**Your Dermique Routine Summary:**
[3-4 sentences tying all 3 products into a morning/night routine.]

=== TONE RULES ===
- Warm but clinical — like a knowledgeable doctor friend
- Never overpromise results
- Never be vague — every claim must connect to an ingredient

CRITICAL: You MUST ONLY recommend products that are in the provided catalog below! Do NOT invent or hallucinate products!
"""

    def recommend(self, skin_profile: dict) -> dict:
        start_time = time.time()
        
        # Step 1 — build search query from profile:
        query = f"skincare for {skin_profile.get('skin_type', 'all')} skin targeting {', '.join(skin_profile.get('concerns', []))}"
        
        # Step 2 — embed the query using HuggingFace free API:
        api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"} if os.getenv("HF_TOKEN") else {}
        
        query_vector = [0.0] * 384
        for attempt in range(5):  # Try up to 5 times (wait for cold start)
            try:
                print(f"HF API Attempt {attempt + 1}...")
                response = requests.post(api_url, headers=headers, json={"inputs": [query]}, timeout=30)
                if response.status_code == 200:
                    print("HF API Success!")
                    result = response.json()
                    query_vector = result[0] if isinstance(result[0], list) else result
                    break
                elif response.status_code == 503:
                    # Model is loading
                    estimated_time = response.json().get("estimated_time", 10)
                    print(f"Model is loading, waiting {estimated_time} seconds...")
                    time.sleep(estimated_time)
                else:
                    print(f"HF API Failed with status {response.status_code}: {response.text}")
                    break
            except Exception as e:
                print(f"HF API Exception: {e}")
                break
        
        # Step 3 — query Pinecone:
        results = self.index.query(
            vector=query_vector,
            top_k=3,
            include_metadata=True
        )
        
        # Step 4 — format retrieved products as string:
        retrieved = ""
        product_list = []
        for match in results.matches:
            m = match.metadata
            retrieved += f"Name: {m.get('name', 'Unknown')}\n"
            retrieved += f"URL: {m.get('url', '')}\n"
            retrieved += f"Concerns: {m.get('concerns', [])}\n"
            retrieved += f"Description: {m.get('description', '')}\n\n"
            product_list.append({
                "name": m.get("name", "Unknown"),
                "category": m.get("category", "Skincare"),
                "rating": m.get("rating", "4.5"),
                "product_url": m.get("url", "")
            })
        
        if not retrieved.strip():
            try:
                import json
                products_path = os.path.join(os.path.dirname(__file__), "..", "products.json")
                if not os.path.exists(products_path):
                    products_path = os.path.join(os.path.dirname(__file__), "..", "..", "products.json")
                
                if os.path.exists(products_path):
                    with open(products_path, "r", encoding="utf-8") as f:
                        local_products = json.load(f)
                    
                    # Dynamic Fallback Scoring (since HF API is down)
                    scored_products = []
                    u_concerns = [c.lower() for c in skin_profile.get('concerns', [])]
                    u_skin = skin_profile.get('skin_type', '').lower()
                    
                    for p in local_products:
                        score = 0
                        p_concerns = [c.lower() for c in p.get('concerns', [])]
                        for c in u_concerns:
                            if c in p_concerns:
                                score += 2
                                
                        p_skin = p.get('skin_type', '').lower()
                        if p_skin == u_skin or 'all' in p_skin:
                            score += 1
                        scored_products.append((score, p))
                        
                    scored_products.sort(key=lambda x: x[0], reverse=True)
                    top_fallback = [p for score, p in scored_products[:3]]
                    
                    for p in top_fallback:
                        retrieved += f"Name: {p.get('name', 'Unknown')}\n"
                        retrieved += f"URL: {p.get('url', '')}\n"
                        retrieved += f"Concerns: {p.get('concerns', [])}\n"
                        retrieved += f"Description: {p.get('description', '')}\n\n"
                        product_list.append({
                            "name": p.get("name", "Unknown"),
                            "category": "Skincare",
                            "rating": "4.8",
                            "product_url": p.get("url", "")
                        })
            except Exception as e:
                print(f"Fallback to products.json failed: {e}")
                
        if not retrieved.strip():
            retrieved = "NO PRODUCTS FOUND IN DATABASE. Please tell the user you cannot find any matching products right now."
            
        user_message = f"""User skin profile:
- Skin type: {skin_profile.get('skin_type')}
- Concerns: {', '.join(skin_profile.get('concerns', []))}
- Age range: {skin_profile.get('age_range', 'not specified')}
- Sensitivities: {', '.join(skin_profile.get('sensitivities', ['none']))}

--- FULL PRODUCT CATALOG ---
{retrieved}
----------------------------

Based on the user's profile and the catalog above, pick the 3 absolute best products and write personalized recommendations."""

        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.2,
                max_tokens=1024,
                top_p=1,
                stream=False
            )
            
            response_text = response.choices[0].message.content
            tokens = response.usage.total_tokens
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "response": response_text,
                "latency_ms": latency_ms,
                "tokens": tokens,
                "products": product_list
            }
        except Exception as e:
            return {"response": str(e), "products": []}
