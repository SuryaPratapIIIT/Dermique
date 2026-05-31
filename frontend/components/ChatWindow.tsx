"use client"
import { useEffect, useRef } from "react"
import { Message } from "@/types"
import MessageBubble from "./MessageBubble"

export default function ChatWindow({ messages, isLoading, loadingMessage, isMobile }: { messages: Message[], isLoading: boolean, loadingMessage?: string, isMobile?: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // ── EMPTY STATE ──
  if (messages.length === 0) {
    return (
      <div 
        className="empty-state-container"
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Glass orb — bigger for desktop, scaled for mobile */}
        <div 
          className="glass-orb"
          style={{
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.98) 0%, rgba(255,182,255,0.65) 35%, rgba(135,206,250,0.55) 65%, rgba(236,72,153,0.75) 100%)",
            boxShadow: "inset 10px 10px 30px rgba(255,255,255,0.9), inset -15px -15px 40px rgba(0,0,0,0.04), 0 24px 70px rgba(236,72,153,0.22), 0 8px 40px rgba(100,100,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.75)",
            position: "relative",
            animation: "floatOrb 5s ease-in-out infinite",
            marginBottom: "8px",
          }}
        >
          <div style={{
            position: "absolute", top: "14%", left: "18%",
            width: "30%", height: "18%",
            background: "rgba(255,255,255,0.92)", borderRadius: "50%",
            transform: "rotate(-35deg)"
          }} />
        </div>

        <div style={{ textAlign: "center", maxWidth: "560px", padding: "0 12px" }}>
          <h2 className="empty-state-title" style={{ fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            How can I help your skin today?
          </h2>
          <p className="empty-state-desc" style={{ color: "#888" }}>
            Describe your skin type and concerns — Dermique's AI will analyze your profile and recommend the perfect routine.
          </p>
        </div>

        <style>{`
          @keyframes floatOrb {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div 
      className="chat-window-container"
      style={{
        display: "flex", flexDirection: "column",
        gap: "4px",
        maxWidth: "900px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} isMobile={isMobile} />)}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginTop: "4px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(255,182,255,0.6) 40%, rgba(135,206,250,0.5) 65%, rgba(236,72,153,0.7) 100%)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 4px 14px rgba(236,72,153,0.2)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "15%", left: "18%",
              width: "30%", height: "18%",
              background: "rgba(255,255,255,0.9)", borderRadius: "50%",
              transform: "rotate(-35deg)"
            }} />
          </div>
          <div style={{
            background: "rgba(255,255,255,0.82)", borderRadius: "20px 20px 20px 6px",
            padding: "16px 22px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.9)",
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {loadingMessage && (
                <span style={{ fontSize: "14px", color: "#555", fontWeight: 500 }}>{loadingMessage}</span>
              )}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#ec4899",
                    animation: `dot 1.2s ease-in-out ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      <style>{`
        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
