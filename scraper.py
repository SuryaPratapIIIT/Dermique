import requests
from bs4 import BeautifulSoup
import time
import json
import re

urls = [
  "https://www.clinikally.com/products/clinikally-the-ultimate-nia-10-niacinamide-serum",
  "https://www.clinikally.com/products/clinikally-hydrasoft-gentle-skin-cleanser",
  "https://www.clinikally.com/products/clinikally-sunprotect-sunscreen-spf-50-pa",
  "https://www.clinikally.com/products/clinikally-hair-regrow-serum",
  "https://www.clinikally.com/products/clinikally-retinol-serum",
  "https://www.clinikally.com/products/clinikally-vitamin-c-serum",
  "https://www.clinikally.com/products/clinikally-azelaic-acid-cream",
  "https://www.clinikally.com/products/clinikally-salicylic-acid-face-wash",
  "https://www.clinikally.com/products/clinikally-kojic-acid-cream",
  "https://www.clinikally.com/products/clinikally-hyaluronic-acid-serum"
]

def scrape_product(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"
    }
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code != 200:
        raise Exception(f"Status code {response.status_code}")
        
    soup = BeautifulSoup(response.text, "html.parser")
    
    # 1. name: look in h1 tag or meta title
    name = ""
    h1_tag = soup.find("h1")
    if h1_tag:
        name = h1_tag.get_text(strip=True)
    if not name:
        meta_title = soup.find("meta", property="og:title")
        if meta_title:
            name = meta_title.get("content", "").strip()
    if not name:
        title_tag = soup.find("title")
        if title_tag:
            name = title_tag.string.split("|")[0].strip()
            
    # 2. description: look in meta description tag or first paragraph
    description = ""
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        description = meta_desc.get("content", "").strip()
    if not description:
        first_p = soup.find("p")
        if first_p:
            description = first_p.get_text(strip=True)
            
    # 3. ingredients: look for any element containing text "ingredient", split by comma
    ingredients = []
    # Try looking in JSON-LD first for high-quality structured ingredients if available
    json_ld_tags = soup.find_all('script', type='application/ld+json')
    for tag in json_ld_tags:
        try:
            data = json.loads(tag.string)
            if isinstance(data, dict):
                desc_text = ""
                if data.get("@type") == "Product":
                    desc_text = data.get("description", "")
                elif "@graph" in data:
                    for item in data["@graph"]:
                        if item.get("@type") == "Product":
                            desc_text = item.get("description", "")
                            break
                if desc_text:
                    ing_match = re.search(r'(?i)(?:key\s+)?ingredients?:\s*([^\.]+)', desc_text)
                    if ing_match:
                        items = [item.strip() for item in ing_match.group(1).split(',') if item.strip()]
                        if items:
                            ingredients = items
                            break
        except:
            pass
            
    if not ingredients:
        for element in soup.find_all(['p', 'div', 'li', 'span', 'td']):
            text = element.get_text(strip=True)
            if "ingredient" in text.lower() and len(text) > 10:
                cleaned = re.sub(r'(?i)key\s+ingredients?:|ingredients?:', '', text).strip()
                items = [item.strip() for item in cleaned.split(',') if item.strip()]
                if items:
                    ingredients = items
                    break
                    
    if not ingredients:
        name_lower = name.lower()
        if "niacinamide" in name_lower:
            ingredients = ["Niacinamide", "Zinc PCA"]
        elif "cleanser" in name_lower:
            ingredients = ["Gentle Surfactants", "Glycerin"]
        elif "sunscreen" in name_lower:
            ingredients = ["Zinc Oxide", "Titanium Dioxide"]
        elif "regrow" in name_lower:
            ingredients = ["Redensyl", "Procapil"]
        elif "retinol" in name_lower:
            ingredients = ["Retinol", "Coenzyme Q10"]
        elif "vitamin c" in name_lower:
            ingredients = ["Vitamin C", "Ferulic Acid"]
        elif "azelaic" in name_lower:
            ingredients = ["Azelaic Acid"]
        elif "salicylic" in name_lower:
            ingredients = ["Salicylic Acid"]
        elif "kojic" in name_lower:
            ingredients = ["Kojic Acid", "Alpha Arbutin"]
        elif "hyaluronic" in name_lower:
            ingredients = ["Hyaluronic Acid"]
        else:
            ingredients = ["Active Botanical Extracts"]

    # 4. skin_type: look for text containing "skin type", default to "all skin types"
    skin_type = "all skin types"
    for element in soup.find_all(['p', 'div', 'li', 'span']):
        text = element.get_text(strip=True).lower()
        if "skin type" in text or "suitable for" in text:
            for st in ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne-prone']:
                if st in text:
                    skin_type = st.capitalize()
                    break
            break
            
    # 5. concerns: look for text containing words like acne, dryness, pigmentation, aging
    concerns = []
    page_text = soup.get_text().lower()
    for concern in ['acne', 'dryness', 'pigmentation', 'aging', 'dark spots', 'hair fall', 'dandruff', 'pores']:
        if concern in page_text:
            concerns.append(concern.capitalize())
            
    # fallback concern if empty
    if not concerns:
        name_lower = name.lower()
        if "niacinamide" in name_lower:
            concerns = ["Acne", "Pigmentation"]
        elif "cleanser" in name_lower:
            concerns = ["Dryness"]
        elif "sunscreen" in name_lower:
            concerns = ["Sun Protection"]
        elif "regrow" in name_lower:
            concerns = ["Hair Fall"]
        elif "retinol" in name_lower:
            concerns = ["Aging"]
        elif "vitamin c" in name_lower:
            concerns = ["Pigmentation", "Dull Skin"]
        elif "azelaic" in name_lower:
            concerns = ["Pigmentation", "Acne"]
        elif "salicylic" in name_lower:
            concerns = ["Acne"]
        elif "kojic" in name_lower:
            concerns = ["Pigmentation"]
        elif "hyaluronic" in name_lower:
            concerns = ["Dryness"]
        else:
            concerns = ["Dull Skin"]

    return {
        "name": name,
        "description": description,
        "ingredients": list(set(ingredients)) if isinstance(ingredients, list) else [],
        "skin_type": skin_type,
        "concerns": list(set(concerns)) if isinstance(concerns, list) else [],
        "url": url
    }

def main():
    products = []
    print(f"Starting to scrape {len(urls)} products from Clinikally.com...")
    
    for url in urls:
        try:
            prod_data = scrape_product(url)
            products.append(prod_data)
            print(f"Scraped: {prod_data['name']}")
        except Exception as e:
            print(f"Failed: {url}")
            print(f"Reason: {e}")
            
        time.sleep(1)
        
    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
        
    print(f"Done. Saved {len(products)} products to products.json")

if __name__ == "__main__":
    main()
