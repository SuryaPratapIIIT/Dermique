import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

class RecommenderAgent:
    def __init__(self):
        load_dotenv()
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        
        # Load products from local JSON file instead of Pinecone to guarantee it works 100% of the time!
        try:
            # When running on Render, the root is backend/
            products_path = os.path.join(os.path.dirname(__file__), "..", "products.json")
            if not os.path.exists(products_path):
                # Fallback for local testing
                products_path = os.path.join(os.path.dirname(__file__), "..", "..", "products.json")
                
            with open(products_path, "r", encoding="utf-8") as f:
                self.products = json.load(f)
        except Exception as e:
            print("Failed to load products.json:", e)
            self.products = []
            
        # Format products catalog into a string once on startup
        self.catalog_string = ""
        for i, p in enumerate(self.products):
            self.catalog_string += f"Product #{i+1}:\n"
            self.catalog_string += f"- Name: {p.get('name', 'Unknown')}\n"
            self.catalog_string += f"- URL: {p.get('url', 'Unknown')}\n"
            self.catalog_string += f"- Type: {p.get('skin_type', 'Unknown')}\n"
            self.catalog_string += f"- Concerns: {', '.join(p.get('concerns', []))}\n"
            self.catalog_string += f"- Key Ingredients: {', '.join(p.get('key_ingredients', []))}\n"
            self.catalog_string += f"- Description: {p.get('description', '')}\n\n"
        
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
        if not self.products:
            return {"response": "Product catalog is empty. Could not load products.json", "products": []}
            
        user_message = f"""User skin profile:
- Skin type: {skin_profile.get('skin_type')}
- Concerns: {', '.join(skin_profile.get('concerns', []))}
- Age range: {skin_profile.get('age_range', 'not specified')}
- Sensitivities: {', '.join(skin_profile.get('sensitivities', ['none']))}

--- FULL PRODUCT CATALOG ---
{self.catalog_string}
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
            
            # Create a mock product list since we aren't using pinecone metadata anymore
            product_list = [
                {"name": "Clinikally Product 1", "category": "Skincare", "rating": "4.8", "product_url": "#"},
                {"name": "Clinikally Product 2", "category": "Skincare", "rating": "4.8", "product_url": "#"},
                {"name": "Clinikally Product 3", "category": "Skincare", "rating": "4.8", "product_url": "#"}
            ]
            
            return {
                "response": response_text,
                "latency_ms": latency_ms,
                "tokens": tokens,
                "products": product_list
            }
        except Exception as e:
            return {"response": str(e), "products": []}
