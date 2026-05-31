"use client"
import { useState, useEffect } from "react"
import { Message, ChatResponse, SkinProfile, SavedSession } from "@/types"
import ChatWindow from "@/components/ChatWindow"
import ChatInput from "@/components/ChatInput"
import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [profile, setProfile] = useState<SkinProfile | null>(null)
  
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Track window resizing for mobile devices
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Load sessions on mount
  useEffect(() => {
    const stored = localStorage.getItem("dermique_sessions")
    if (stored) {
      try {
        setSavedSessions(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load sessions", e)
      }
    }
  }, [])

  // Auto-save active session whenever messages or profile change
  useEffect(() => {
    if (messages.length === 0) return

    setSavedSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === sessionId)
      const firstUserMsg = messages.find(m => m.role === "user")?.content || "New Session"
      const title = firstUserMsg.length > 28 ? firstUserMsg.slice(0, 25) + "..." : firstUserMsg
      
      const currentSession: SavedSession = {
        id: sessionId,
        date: prev[existingIdx]?.date || Date.now(),
        title,
        messages,
        profile
      }

      const newSessions = [...prev]
      if (existingIdx >= 0) {
        newSessions[existingIdx] = currentSession
      } else {
        newSessions.unshift(currentSession) // Add to top
      }

      localStorage.setItem("dermique_sessions", JSON.stringify(newSessions))
      return newSessions
    })
  }, [messages, profile, sessionId])

  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    try {
      const res = await axios.post<ChatResponse>(`${API_URL}/chat`, { message: text, session_id: sessionId })
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: res.data.response, products: res.data.products }])
      if (res.data.profile) setProfile(res.data.profile)
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, something went wrong. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUploadStart = (file: File) => {
    const objectUrl = URL.createObjectURL(file)
    const imageMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: "Uploaded a skin photo for clinical analysis.",
      image: objectUrl
    }
    setMessages(prev => [...prev, imageMsg])
    setIsLoading(true)
    setLoadingMessage("🔍 Analyzing your skin...")
  }

  const handleImageResult = (data: any) => {
    setIsLoading(false)
    setLoadingMessage("")
    
    if (data.error || !data.ready) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response || "Could not analyze skin from this image. Please upload a clear face photo."
        }
      ])
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          products: data.products
        }
      ])
      if (data.profile) {
        setProfile(data.profile)
      }
    }
  }

  const handleVoiceStart = () => {
    setIsLoading(true)
    setLoadingMessage("🎙️ Transcribing voice message...")
  }

  const handleVoiceResult = (transcript: string, data: any) => {
    setIsLoading(false)
    setLoadingMessage("")
    
    if (data.error) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response || "Sorry, I could not understand the audio. Please try again."
        }
      ])
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: `🎤 ${transcript}`,
          transcribed: true
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          products: data.products
        }
      ])
      if (data.profile) {
        setProfile(data.profile)
      }
    }
  }

  const startNewSession = () => {
    setSessionId(crypto.randomUUID())
    setMessages([])
    setProfile(null)
    setLoadingMessage("")
    setIsLoading(false)
    setSidebarOpen(false)
  }

  const loadSession = (session: SavedSession) => {
    setSessionId(session.id)
    setMessages(session.messages)
    setProfile(session.profile)
    setSidebarOpen(false)
  }

  const deleteSession = (sessionId: string) => {
    setSavedSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId)
      localStorage.setItem("dermique_sessions", JSON.stringify(updated))
      return updated
    })
  }

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", position: "relative", zIndex: 1 }}>
      
      {/* ══════════════════════════════════════════
          MOBILE SIDEBAR BACKDROP
      ══════════════════════════════════════════ */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="show-on-mobile"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(4px)",
            zIndex: 99,
            animation: "fadeIn 0.25s ease-out",
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          LEFT SIDEBAR (Drawer on Mobile)
      ══════════════════════════════════════════ */}
      <aside 
        className={`sidebar-drawer ${sidebarOpen ? "open" : ""}`}
        style={{
          position: "relative",
          top: 0, left: 0, bottom: 0,
          width: "280px", flexShrink: 0,
          display: "flex", flexDirection: "column",
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(255,255,255,0.6)",
          padding: "28px 20px",
          gap: "8px",
          zIndex: 100,
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          height: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(255,182,255,0.65) 40%, rgba(135,206,250,0.55) 65%, rgba(236,72,153,0.75) 100%)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 4px 16px rgba(236,72,153,0.25)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "13%", left: "16%",
              width: "30%", height: "18%",
              background: "rgba(255,255,255,0.9)", borderRadius: "50%",
              transform: "rotate(-35deg)"
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#1a1a1a", letterSpacing: "-0.3px" }}>Dermique</div>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: 500 }}>AI Skin Assistant</div>
          </div>
        </div>

        {/* New Chat */}
        <button
          onClick={startNewSession}
          style={{
            width: "100%", padding: "10px 14px",
            background: "linear-gradient(135deg, #ec4899, #f472b6)",
            border: "none", borderRadius: "12px",
            color: "#fff", fontWeight: 600, fontSize: "14px",
            cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 16px rgba(236,72,153,0.3)",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "16px" }}>✏️</span> New Session
        </button>

        {/* Recent Consultations List */}
        {savedSessions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: "11px", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingLeft: "4px" }}>
              Recent Consultations
            </div>
            {savedSessions.map(session => (
              <div
                key={session.id}
                className="session-item"
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  borderRadius: "10px",
                  background: session.id === sessionId ? "rgba(236,72,153,0.08)" : "transparent",
                  border: session.id === sessionId ? "1px solid rgba(236,72,153,0.15)" : "1px solid transparent",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (session.id !== sessionId) { e.currentTarget.style.background = "rgba(0,0,0,0.03)" } }}
                onMouseLeave={e => { if (session.id !== sessionId) { e.currentTarget.style.background = "transparent" } }}
              >
                <button
                  onClick={() => loadSession(session)}
                  style={{
                    flex: 1, padding: "10px 8px 10px 12px",
                    background: "transparent", border: "none",
                    color: session.id === sessionId ? "#ec4899" : "#555",
                    fontWeight: session.id === sessionId ? 600 : 500,
                    fontSize: "13px",
                    cursor: "pointer", textAlign: "left",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {session.title}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                  title="Delete session"
                  style={{
                    flexShrink: 0,
                    background: "transparent", border: "none",
                    color: "#ccc", fontSize: "15px",
                    cursor: "pointer", padding: "6px 8px",
                    borderRadius: "6px",
                    lineHeight: 1,
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#ccc"; e.currentTarget.style.background = "transparent" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Spacer + Skin Profile Card */}
        <div style={{ marginTop: "auto", paddingTop: "16px" }}>
          {profile && (
            <div style={{
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(236,72,153,0.15)",
              borderRadius: "16px", padding: "16px",
              marginBottom: "16px",
            }}>
              <div style={{ fontSize: "11px", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                Active Profile
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {profile.skin_type && (
                  <span style={{
                    background: "linear-gradient(135deg, #ec4899, #f472b6)",
                    color: "#fff", borderRadius: "20px",
                    padding: "3px 10px", fontSize: "12px", fontWeight: 600,
                    textTransform: "capitalize"
                  }}>{profile.skin_type}</span>
                )}
                {profile.concerns?.map((c, i) => (
                  <span key={i} style={{
                    background: "rgba(0,0,0,0.05)", color: "#555",
                    borderRadius: "20px", padding: "3px 10px", fontSize: "12px",
                    textTransform: "capitalize"
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: "12px", color: "#aaa", textAlign: "center" }}>
            Powered by DermiQ Core
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div 
          className="responsive-header"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(16px)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="show-on-mobile"
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1.5px solid rgba(0,0,0,0.06)",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#333",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "4px",
              }}
            >
              ☰ Menu
            </button>
            <div>
              <h1 className="responsive-title" style={{ fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                Skin Assessment
              </h1>
              <p className="hide-on-mobile" style={{ fontSize: "13px", color: "#888", marginTop: "1px" }}>
                Tell me about your skin — I'll find the right products
              </p>
            </div>
          </div>
          <div 
            className="responsive-online-badge"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: "30px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }} />
            <span className="hide-on-mobile" style={{ fontSize: "13px", fontWeight: 600, color: "#555" }}>
              System Online
            </span>
            <span className="show-on-mobile" style={{ fontSize: "11px", fontWeight: 600, color: "#555" }}>
              Online
            </span>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <ChatWindow messages={messages} isLoading={isLoading} loadingMessage={loadingMessage} isMobile={isMobile} />
        </div>

        {/* Input bar */}
        <div 
          className="responsive-input-bar"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(16px)",
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <ChatInput 
              onSend={sendMessage} 
              isLoading={isLoading} 
              sessionId={sessionId}
              onImageUploadStart={handleImageUploadStart}
              onImageResult={handleImageResult}
              onVoiceStart={handleVoiceStart}
              onVoiceResult={handleVoiceResult}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

