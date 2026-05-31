"use client"
import { Message } from "@/types"
import ReactMarkdown from "react-markdown"
import ProductCard from "./ProductCard"
import { useState, useRef } from "react"

export default function MessageBubble({ message, isMobile }: { message: Message, isMobile?: boolean }) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end",
        alignItems: "flex-end", gap: "10px", marginBottom: "20px",
      }}>
        <div 
          className="user-message-bubble-wrapper"
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end",
            width: "100%",
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, #ec4899, #f472b6)",
            color: "#fff", padding: "14px 20px",
            borderRadius: "20px 20px 6px 20px",
            fontSize: "15px", lineHeight: "1.5", fontWeight: 500,
            boxShadow: "0 4px 20px rgba(236,72,153,0.35)",
            width: "100%",
          }}>
            {message.image && (
              <img 
                src={message.image} 
                alt="Uploaded skin photo"
                style={{ borderRadius: 12, width: 200, marginBottom: message.content ? 8 : 0 }} 
              />
            )}
            {message.content}
          </div>
          {message.transcribed && (
            <span style={{ fontSize: "11px", color: "#888", fontStyle: "italic", marginTop: "4px", marginRight: "6px" }}>
              Voice message transcribed
            </span>
          )}
        </div>
        <div 
          className="hide-on-mobile"
          style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #a78bfa, #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "15px", boxShadow: "0 2px 10px rgba(167,139,250,0.4)",
          }}
        >
          👤
        </div>
      </div>
    )
  }

  // ── Assistant ──
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playTTS = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
      return
    }

    setIsPlaying(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      
      // Clean markdown characters from text before speech for clean audio
      const cleanText = message.content
        .replace(/[*#_`~\[\]()\-+>]/g, "")
        .trim()
        
      const res = await fetch(`${API_URL}/speak?text=${encodeURIComponent(cleanText)}`, {
        method: "POST"
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setIsPlaying(false)
      audio.play()
    } catch (err) {
      console.error("TTS playback error:", err)
      setIsPlaying(false)
    }
  }

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
        {/* Glass orb avatar */}
        <div 
          className="hide-on-mobile"
          style={{
            width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
            background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(255,182,255,0.6) 40%, rgba(135,206,250,0.5) 65%, rgba(236,72,153,0.7) 100%)",
            border: "1px solid rgba(255,255,255,0.8)", position: "relative",
            boxShadow: "0 4px 14px rgba(236,72,153,0.2)",
          }}
        >
          <div style={{
            position: "absolute", top: "15%", left: "18%",
            width: "30%", height: "18%",
            background: "rgba(255,255,255,0.9)", borderRadius: "50%", transform: "rotate(-35deg)"
          }} />
        </div>

        {/* Bubble */}
        <div 
          className="assistant-message-bubble-wrapper"
          style={{
            background: "rgba(255,255,255,0.82)", color: "#1a1a1a",
            padding: "16px 36px 16px 22px", borderRadius: "20px 20px 20px 6px",
            fontSize: "15px", lineHeight: "1.65",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.9)",
            position: "relative",
          }}
        >
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
 
          {/* TTS Speaker icon */}
          <button 
            onClick={playTTS} 
            title={isPlaying ? "Pause voice readout" : "Listen aloud"}
            style={{
              position: "absolute",
              right: "10px",
              bottom: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              fontSize: "14px",
              opacity: 0.45,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}
          >
            {isPlaying ? "⏸" : "🔊"}
          </button>
        </div>
      </div>
 
      {/* Product cards (Directly from structured response) */}
      {message.products && message.products.length > 0 && (
        <div 
          className="product-carousel custom-carousel no-scrollbar"
          style={{ marginTop: "4px" }}
        >
          {message.products.map((p, idx) => (
            <ProductCard 
              key={idx} 
              name={p.name} 
              category={p.category}
              rating={p.rating}
              product_url={p.product_url}
              reason={p.reason || ""}
              note={p.note || "None"}
            />
          ))}
        </div>
      )}
    </div>
  )
}
