"use client"
import { useState, useRef, useEffect } from "react"

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
  sessionId: string
  onImageUploadStart?: (file: File) => void
  onImageResult: (data: any) => void
  onVoiceStart: () => void
  onVoiceResult: (transcript: string, result: any) => void
}

export default function ChatInput({ onSend, isLoading, sessionId, onImageUploadStart, onImageResult, onVoiceStart, onVoiceResult }: Props) {
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobEvent["data"][]>([])
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick)
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [showMenu])

  const toggleRecording = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []
        
        mediaRecorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            chunksRef.current.push(ev.data)
          }
        }
        
        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorder.mimeType || "audio/webm"
          const blob = new Blob(chunksRef.current, { type: mimeType })
          setAudioBlob(blob)
          
          if (blob.size > 0) {
            await sendVoiceMessage(blob, mimeType)
          }
          stream.getTracks().forEach(t => t.stop())
        }
        
        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error("Microphone access error:", err)
        alert("Could not access your microphone. Please ensure microphone permissions are granted.")
      }
    }
  }

  const sendVoiceMessage = async (blob: Blob, mimeType: string) => {
    const suffix = mimeType.includes("mp4") ? "mp4" : (mimeType.includes("wav") ? "wav" : "webm")
    const voiceFile = new File([blob], `voice.${suffix}`, { type: mimeType })
    
    const formData = new FormData()
    formData.append("file", voiceFile)
    formData.append("session_id", sessionId)
    
    onVoiceStart()
    
    try {
      const res = await fetch(`${API_URL}/voice`, {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      onVoiceResult(data.transcript, data)
    } catch (err) {
      console.error("Error transcribing voice message:", err)
      onVoiceResult("", { error: true, response: "Could not transcribe audio. Please try again." })
    }
  }

  const handleSend = () => {
    if (text.trim() && !isLoading && !isUploading) {
      onSend(text.trim())
      setText("")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    
    if (onImageUploadStart) {
      onImageUploadStart(file)
    }
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("session_id", sessionId)
    
    try {
      const res = await fetch(`${API_URL}/analyze-image`, {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      onImageResult(data)
    } catch (err) {
      console.error("Error uploading/analyzing skin image:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const canSend = !!text.trim() && !isLoading && !isUploading

  return (
    <div 
      className="chat-input-pill-container"
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        border: "1.5px solid rgba(255,255,255,0.95)",
        borderRadius: "32px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Hidden file input */}
      <input 
        type="file" 
        accept="image/*" 
        style={{display: "none"}} 
        ref={fileInputRef}
        onChange={handleImageUpload}
        disabled={isLoading || isUploading || isRecording}
      />

      {/* Relative container for popover */}
      <div ref={containerRef} className="chat-input-buttons-group">
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {/* Attach/Plus button */}
          <button 
            title="Attach skin/face photo" 
            disabled={isLoading || isUploading || isRecording}
            onClick={() => setShowMenu(!showMenu)}
            className="chat-input-circle-btn"
            style={{
              background: "rgba(0,0,0,0.04)", 
              border: "1.5px solid rgba(0,0,0,0.06)",
              borderRadius: "50%",
              cursor: (isLoading || isUploading || isRecording) ? "not-allowed" : "pointer", 
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: (isLoading || isUploading || isRecording) ? 0.4 : 0.8, 
              flexShrink: 0,
              transition: "all 0.2s ease",
              fontWeight: "bold",
              color: "#333",
              lineHeight: 1,
            }}
            onMouseEnter={e => { if (!isLoading && !isUploading && !isRecording) { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "scale(1.08)" } }}
            onMouseLeave={e => { if (!isLoading && !isUploading && !isRecording) { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "scale(1)" } }}
          >
            +
          </button>

          {showMenu && (
            <div style={{
              position: "absolute",
              bottom: "48px",
              left: "0",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "6px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              zIndex: 50,
              width: "160px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              transformOrigin: "bottom left",
              animation: "slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
            }}>
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowMenu(false)
                }}
                style={{
                  background: "none",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: "14px",
                  color: "#333",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)"; e.currentTarget.style.color = "#ec4899" }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#333" }}
              >
                📷 Upload Photo
              </button>
            </div>
          )}
        </div>

        {/* Microphone recording button - Hidden when user is typing */}
        {!text.trim() && (
          <button
            onClick={toggleRecording}
            title={isRecording ? "Click to stop recording" : "Click to record voice message"}
            disabled={isLoading || isUploading}
            className="chat-input-circle-btn"
            style={{
              borderRadius: "50%",
              background: isRecording 
                ? "#D85A30"           
                : "rgba(0,0,0,0.04)", 
              border: isRecording 
                ? "2px solid #FF8C6B" 
                : "1.5px solid rgba(0,0,0,0.06)",
              color: isRecording ? "#FFFFFF" : "#333",
              cursor: (isLoading || isUploading) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
              animation: isRecording 
                ? "pulse 1.2s ease-in-out infinite" 
                : "none",
              lineHeight: 1,
              userSelect: "none",
              opacity: (isLoading || isUploading) ? 0.4 : 0.8,
            }}
            onMouseEnter={e => { if (!isRecording && !isLoading && !isUploading) e.currentTarget.style.background = "rgba(0,0,0,0.08)" }}
            onMouseLeave={e => { if (!isRecording && !isLoading && !isUploading) e.currentTarget.style.background = "rgba(0,0,0,0.04)" }}
          >
            {isRecording ? "⏹" : "🎤"}
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(216,90,48,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(216,90,48,0); }
        }
      `}</style>

      {/* Input */}
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSend() }}
        placeholder={isUploading ? "🔍 Analyzing skin..." : "Ask about your skin..."}
        disabled={isLoading || isUploading}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: "15px",
          color: "#1a1a1a",
          fontWeight: 400,
          minWidth: "60px",
        }}
      />


      <button
        onClick={handleSend}
        disabled={!canSend}
        className="chat-input-send-btn"
        style={{
          background: canSend
            ? "linear-gradient(135deg, #ec4899, #f472b6)"
            : "rgba(0,0,0,0.07)",
          border: "none",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canSend ? "pointer" : "not-allowed",
          flexShrink: 0,
          transition: "all 0.2s ease",
          boxShadow: canSend ? "0 4px 18px rgba(236,72,153,0.4)" : "none",
          transform: canSend ? "scale(1)" : "scale(0.95)",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={canSend ? "#fff" : "#aaa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  )
}
