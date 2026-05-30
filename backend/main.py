from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import sys

# Ensure parent directory is in sys.path so agents and utils can be imported
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from agents.router import Router

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

@app.get("/health")
async def health():
    return {"status": "ok", "message": "Dermiq API is running"}

# Trigger reload 4
