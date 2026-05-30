from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import sys
import base64


# Ensure parent directory is in sys.path so agents and utils can be imported
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from agents.router import Router
from agents.voice_agent import VoiceAgent
from fastapi.responses import Response

app = FastAPI(title="Clara Lite skincare AI API")

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sessions dictionary to hold Router instances per session_id
sessions: Dict[str, Router] = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    state: str
    profile: Optional[Dict[str, Any]] = None
    products: Optional[list] = None

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        session_id = request.session_id
        message = request.message
        
        if session_id not in sessions:
            sessions[session_id] = Router()
            
        router = sessions[session_id]
        result = router.process(message)
        
        return ChatResponse(
            response=result.get("response", ""),
            state=result.get("state", "INTAKE"),
            profile=result.get("profile"),
            products=result.get("products")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    try:
        # Read and encode image to base64
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        
        if session_id not in sessions:
            sessions[session_id] = Router()
        
        result = sessions[session_id].process_image(base64_image)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice")
async def voice_to_recommendation(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    try:
        # Step 1 — Read audio bytes
        audio_bytes = await file.read()
        mime_type = file.content_type or "audio/webm"
        
        # Step 2 — Transcribe with Whisper
        if session_id not in sessions:
            sessions[session_id] = Router()
        
        router = sessions[session_id]
        voice_agent = VoiceAgent()
        
        transcription = voice_agent.transcribe(audio_bytes, mime_type)
        
        if not transcription["success"]:
            print(f"Transcription failed: {transcription.get('error')}")
            return {
                "response": "Sorry, I could not understand the audio message. Please speak clearly into your microphone and try again.",
                "transcript": "",
                "state": "INTAKE",
                "profile": None
            }
        
        # Step 3 — Pass transcript to router like normal text
        transcript = transcription["transcript"]
        result = router.process(transcript)
        
        # Step 4 — Return result WITH transcript so
        # frontend can show what was heard
        return {
            **result,
            "transcript": transcript,
            "voice_latency_ms": transcription["latency_ms"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speak")
async def speak_response(text: str):
    try:
        # Optional TTS endpoint
        voice_agent = VoiceAgent()
        audio_bytes = voice_agent.text_to_speech(text)
        return Response(
            content=audio_bytes,
            media_type="audio/wav"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Dermiq API is running"}



# Trigger reload 4
