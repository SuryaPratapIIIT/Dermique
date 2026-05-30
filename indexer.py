import os
import json
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec

def main():
    # 1. Load .env using load_dotenv()
    load_dotenv()
    
    # 2. Load products.json as a list of dicts
    products_file = "products.json"
    if not os.path.exists(products_file):
        raise FileNotFoundError(f"'{products_file}' not found. Please run scraper.py first.")
        
    with open(products_file, "r", encoding="utf-8") as f:
        products = json.load(f)
        
    # 3. Load sentence-transformers model
    print("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
    os.environ["HF_HUB_OFFLINE"] = "1"
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # 4. For each product build this exact embedding string
    texts = []
    for p in products:
        text = (
            f"Product: {p['name']}. "
            f"Skin concerns: {', '.join(p['concerns'])}. "
            f"Skin type: {p['skin_type']}. "
            f"Ingredients: {', '.join(p['ingredients'])}. "
            f"Description: {p['description']}"
        )
        texts.append(text)
        
    # 5. Embed all products at once
    print(f"Generating embeddings for {len(products)} products...")
    embeddings = model.encode(texts)
    
    # 6. Connect to Pinecone using v3 syntax
    pinecone_key = os.getenv("PINECONE_API_KEY")
    if not pinecone_key:
        raise ValueError("PINECONE_API_KEY not found in env.")
    pc = Pinecone(api_key=pinecone_key)
    
    # 7. Create index only if it does not exist
    index_name = "clinikally-products"
    existing_indexes = pc.list_indexes().names()
    if index_name not in existing_indexes:
        print(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    else:
        print(f"Pinecone index '{index_name}' already exists.")
        
    # 8. Connect to the index
    index = pc.Index(index_name)
    
    # 9. Build upsert list
    vectors = [
        {
            "id": f"product-{i}",
            "values": embeddings[i].tolist(),
            "metadata": {
                "name": p["name"],
                "url": p["url"],
                "concerns": p["concerns"],
                "skin_type": p["skin_type"],
                "description": p["description"]
            }
        }
        for i, p in enumerate(products)
    ]
    
    # 10. Upsert in one batch
    print(f"Upserting {len(vectors)} vectors in Pinecone...")
    index.upsert(vectors=vectors)
    
    # 11. Print "Indexed: {p['name']}" for each product
    for p in products:
        print(f"Indexed: {p['name']}")
        
    # 12. Print "Done. {len(vectors)} products indexed in Pinecone."
    print(f"Done. {len(vectors)} products indexed in Pinecone.")

if __name__ == "__main__":
    main()
