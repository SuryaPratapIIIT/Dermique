from groq import Groq
import os
import time
from dotenv import load_dotenv

class VoiceAgent:
    def __init__(self):
        load_dotenv()
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "whisper-large-v3-turbo"

    def transcribe(self, audio_bytes: bytes, mime_type: str = "audio/webm") -> dict:
        start_time = time.time()
        
        try:
            # Step 1 — Detect suffix dynamically:
            if "webm" in mime_type:
                suffix = ".webm"
            elif "mp4" in mime_type or "m4a" in mime_type:
                suffix = ".mp4"
            else:
                suffix = ".wav"
                
            file_name = f"voice{suffix}"

            # Step 2 — Call Groq Whisper in memory (no disk I/O):
            # Prompt must be 896 characters or fewer (optimized to 640 chars)
            transcription = self.client.audio.transcriptions.create(
                file=(file_name, audio_bytes, mime_type),
                model=self.model,
                prompt="""
Skincare and dermatology query for Dermiq by Clinikally.
Keywords/Ingreds: niacinamide, hyaluronic acid, SPF, serum, moisturizer, sunscreen, retinol, vitamin C, salicylic acid, kojic acid, azelaic acid, AHA, BHA, Clinikally, Dermiq.
Concerns: acne, pimples, dark spots, dullness, dryness, wrinkles, large pores, redness, uneven texture, dandruff, itchy scalp, hair fall, thinning hair.
Hinglish support: "mera skin oily hai", "pimples ho rahe hain", "daag dhabe hain", "baal jhad rahe hain", "dandruff hai", "skin dry rehti hai", "redness aati hai", "glow nahi hai".
Transcribe spoken words exactly as pronounced. Do not translate. Keep medical term spellings accurate.
""",
                response_format="text",
                language="en",
                temperature=0.0
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            return {
                "success": True,
                "transcript": transcription.strip(),
                "latency_ms": latency_ms
            }
            
        except Exception as e:
            print(f"VoiceAgent transcription error: {e}")
            return {
                "success": False,
                "transcript": "",
                "error": str(e)
            }

    def text_to_speech(self, text: str) -> bytes:
        try:
            # Use Groq Orpheus TTS to read recommendations aloud.
            response = self.client.audio.speech.create(
                model="canopylabs/orpheus-v1-english",
                voice="luna",
                input=text[:500],  # limit to first 500 chars
                response_format="wav"
            )
            return response.content
        except Exception as e:
            print(f"VoiceAgent text_to_speech error: {e}")
            return b""
