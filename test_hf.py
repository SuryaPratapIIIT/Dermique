import requests
import os
from dotenv import load_dotenv

load_dotenv('.env')

api_url = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2'
headers = {'Authorization': f'Bearer {os.getenv("HF_TOKEN")}'} if os.getenv('HF_TOKEN') else {}

response = requests.post(api_url, headers=headers, json={'inputs': ['skincare for oily skin']}, timeout=30)
print(response.status_code)
print(response.text)
