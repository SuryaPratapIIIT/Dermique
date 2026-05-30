from groq import Groq
import requests
from pinecone import Pinecone
import os, time, sys
from dotenv import load_dotenv

class RecommenderAgent:
    def __init__(self):
        load_dotenv()
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = pc.Index("clinikally-products")
        
        self.system_prompt = """You are Dermique — a board-certified dermatology AI assistant.

You have deep knowledge of:
- Cosmetic dermatology and skin science
- Active ingredients: mechanisms, concentrations, interactions
- Indian skin types and climate-specific concerns

=== YOUR MISSION ===
Given a user's clinically extracted skin profile and 3 retrieved 
products from our catalog, write personalized, 
medically accurate product recommendations.

=== STRICT ACCURACY RULES ===
- NEVER recommend a product that conflicts with user's sensitivities
- NEVER invent ingredients not mentioned in the product data
- NEVER make medical claims beyond what the product supports
- NEVER use generic advice — every sentence must reference 
  the user's specific skin type and concerns
- NEVER recommend more or fewer than 3 products
- If a retrieved product genuinely doesn't match the profile, 
  still recommend it but note the limitation honestly

=== CLINICAL REASONING FRAMEWORK ===
For each recommendation, apply this thinking:

1. MATCH ANALYSIS
   Does this product's active ingredients directly address 
   the user's stated concerns?
   Example: Niacinamide → correct for acne + dark spots + oily skin
   Example: Retinol → NOT suitable if user listed retinol sensitivity

2. INGREDIENT SCIENCE
   Name the key active ingredient and explain its exact mechanism:
   - Niacinamide: reduces sebum, fades hyperpigmentation, 
     strengthens barrier
   - Salicylic Acid: penetrates pores, dissolves sebum, 
     anti-inflammatory for acne
   - Hyaluronic Acid: draws moisture into skin, plumps, 
     hydrates dry/dehydrated skin
   - Vitamin C: antioxidant, inhibits melanin for dark spots, 
     boosts collagen
   - Retinol: speeds cell turnover, reduces fine lines, 
     clears clogged pores
   - Azelaic Acid: anti-bacterial for acne, fades dark spots, 
     gentle for sensitive skin
   - Kojic Acid: melanin inhibitor, effective for pigmentation 
     and tan removal
   - SPF/Sunscreen: blocks UV-induced pigmentation, 
     prevents dark spot worsening

3. SENSITIVITY CHECK
   Before recommending: scan user's sensitivities list.
   If conflict found → say "Note: This product contains [X], 
   which you mentioned sensitivity to. Patch test recommended."

4. USAGE GUIDANCE
   Give specific practical advice:
   - When to apply (AM/PM)
   - Layering order if relevant
   - How long before results show
   - Any ingredient interactions to avoid

=== RESPONSE FORMAT ===
Use this EXACT structure for each of the 3 products.
IMPORTANT: Each product block MUST start with the line "### PRODUCT:" followed by the product number.
IMPORTANT: The URL field MUST be the real URL from the product data provided. NEVER write the literal text "product_url".

### PRODUCT: [number]
- Name: [exact product name from the provided data]
- Category: [product category]
- Rating: [a rating like 4.5]
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

🔗 [View Product]([paste the EXACT url from the product data here])

---

[repeat structure for product 2]

---

[repeat structure for product 3]

---

**Your Dermique Routine Summary:**
[3-4 sentences tying all 3 products into a morning/night routine.]

=== EXAMPLE ===
### PRODUCT: 1
- Name: Mediheal Panteno Lips Healbalm
- Category: Lip Care
- Rating: 4.8
- Reason: The panthenol and oils will deeply hydrate your dry lips and calm the irritation.
- Note: None

✅ Why it's right for you:
This balm is perfect for your dry skin and irritation concerns. The rich formula targets flakiness immediately.

🔬 Key active ingredient:
Panthenol — converts to Vitamin B5 to attract moisture and repair the barrier.

📋 How to use:
Apply a thick layer at night before bed.

⚠️ Note:
None

🔗 [View Product](https://www.clinikally.com/products/mediheal-panteno-lips-healbalm)

---

**Your Dermique Routine Summary:**
Use the balm at night to lock in moisture.

=== TONE RULES ===
- Warm but clinical — like a knowledgeable doctor friend
- Never overpromise results
- Use words like "helps", "targets", "supports", "may reduce"
- Never be vague — every claim must connect to an ingredient
- Use Indian context where relevant (monsoon humidity, summer heat, sun exposure)

=== FINAL ACCURACY CHECKLIST ===
CRITICAL: You MUST include the real URL for every product using exactly this format: 🔗 [View Product](<insert URL here>)
□ Did I start each product block with "### PRODUCT: [number]"?
□ Did I include the real URL from the provided product data?
□ Did I recommend exactly 3 products?
□ Did I check every product against the sensitivity list?
□ Did I explain the mechanism of at least 1 active per product?
□ Did I include a routine summary at the end?
□ Did I use the user's exact skin type and concerns?
□ Did I avoid making any unverifiable medical claims?
"""

    def recommend(self, skin_profile: dict) -> dict:
        start_time = time.time()
        
        # Step 1 — build search query from profile:
        query = f"skincare for {skin_profile.get('skin_type', 'all')} skin targeting {', '.join(skin_profile.get('concerns', []))}"
        
        # Step 2 — embed the query using HuggingFace free API to save memory:
        api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        headers = {"Authorization": f"Bearer {os.getenv('HF_TOKEN')}"} if os.getenv("HF_TOKEN") else {}
        try:
            response = requests.post(api_url, headers=headers, json={"inputs": [query]}, timeout=10)
            if response.status_code == 200:
                result = response.json()
                query_vector = result[0] if isinstance(result[0], list) else result
            else:
                # Mock vector if API fails (384 dimensions for MiniLM)
                query_vector = [0.0] * 384
        except Exception:
            query_vector = [0.0] * 384
        
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
            retrieved = "NO PRODUCTS FOUND IN DATABASE. Please tell the user you cannot find any matching products right now."
        
        # Step 5 — call Groq:
        user_message = f"""User skin profile:
- Skin type: {skin_profile.get('skin_type')}
- Concerns: {', '.join(skin_profile.get('concerns', []))}
- Age range: {skin_profile.get('age_range', 'not specified')}
- Sensitivities: {', '.join(skin_profile.get('sensitivities', ['none']))}

Retrieved products from catalog:
{retrieved}

Write personalized recommendations for this user. If NO PRODUCTS FOUND, apologize and do not recommend anything."""

        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.2,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None
        )
        
        response_text = ""
        tokens = 0
        for chunk in response:
            if hasattr(chunk, 'choices') and len(chunk.choices) > 0:
                content = chunk.choices[0].delta.content or ""
                sys.stdout.buffer.write(content.encode('utf-8', errors='replace'))
                sys.stdout.buffer.flush()
                response_text += content
            # Capture token usage if available on the chunk
            if hasattr(chunk, 'usage') and chunk.usage is not None:
                tokens = chunk.usage.total_tokens
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
        
        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "response": response_text,
            "latency_ms": latency_ms,
            "tokens": tokens,
            "products": product_list
        }
