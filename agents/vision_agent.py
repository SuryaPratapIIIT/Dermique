import os
import json
import time
from dotenv import load_dotenv
from groq import Groq

class VisionAgent:
    def __init__(self):
        load_dotenv()
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"

    def analyze_skin_image(self, image_input: str) -> dict:
        start_time = time.time()
        
        # Step 1 — Build image content block:
        if image_input.startswith("http"):
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_input}
            }
        else:
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_input}"
                }
            }
            
        # Step 2 — System prompt:
        system_prompt = """You are a clinical skin analysis AI for Dermiq by Clinikally.
Analyze the uploaded face or skin image carefully.

Your job is to detect visible skin characteristics and return
a structured skin profile as JSON ONLY.
No markdown. No explanation. Only valid JSON.

Analyze for:
- Skin type: look for shine (oily), flakiness (dry), 
  mixed zones (combination), redness/sensitivity
- Visible concerns: acne/pimples, dark spots, 
  uneven texture, large pores, redness, dullness,
  fine lines, pigmentation
- Skin tone: fair, medium, wheatish, dark
  (relevant for pigmentation products)
- Visible sensitivities: extreme redness, 
  inflamed skin, irritated patches

IMPORTANT RULES:
- Only report what is CLEARLY VISIBLE in the image
- Never hallucinate or assume concerns not visible
- If image is blurry or not a face/skin photo, 
  return error: true
- Be conservative — if unsure, don't include it

Return this exact JSON:
{
  "ready": true,
  "source": "image",
  "skin_type": "oily",
  "concerns": ["acne", "dark spots"],
  "skin_tone": "medium",
  "sensitivities": [],
  "age_range": "20s",
  "confidence": "high",
  "visible_notes": "Visible comedones on forehead, hyperpigmentation on cheeks"
}

If image is invalid or not a skin photo:
{
  "ready": false,
  "error": true,
  "message": "Could not analyze skin from this image. Please upload a clear face photo in good lighting."
}"""

        # Step 3 — Call Groq:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": [
                            image_content,
                            {
                                "type": "text",
                                "text": "Analyze this skin image and return the JSON skin profile."
                            }
                        ]
                    }
                ],
                temperature=0.1,
                max_tokens=400
            )
            
            # Step 4 — Parse response:
            text = response.choices[0].message.content.strip()
            
            # Extract JSON if model wrapped it in markdown code blocks
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text = "\n".join(lines).strip()
                
            result = json.loads(text)
        except Exception as e:
            print(f"VisionAgent analysis error: {e}")
            result = {
                "ready": False, 
                "error": True, 
                "message": "Analysis failed. Please try again."
            }
            
        # Step 5 — Add latency_ms and return result
        latency_ms = (time.time() - start_time) * 1000
        result["latency_ms"] = latency_ms
        return result
