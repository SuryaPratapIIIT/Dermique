"use client"
import { useState } from "react"

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
}

export default function ChatInput({ onSend, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text.trim())
      setText("")
    }
  }

  const canSend = !!text.trim() && !isLoading

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "14px",
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(16px)",
      border: "1.5px solid rgba(255,255,255,0.95)",
      borderRadius: "32px",
      padding: "12px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
    }}>
      {/* Attach icon */}
      <button title="Attach" style={{
        background: "none", border: "none",
        cursor: "pointer", padding: "4px",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0.45, flexShrink: 0,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
      onMouseLeave={e => e.currentTarget.style.opacity = "0.45"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
        </svg>
      </button>

      {/* Input */}
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSend() }}
        placeholder="Ask me something about your skin..."
        disabled={isLoading}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: "15px",
          color: "#1a1a1a",
          fontWeight: 400,
        }}
      />


      <button
        onClick={handleSend}
        disabled={!canSend}
        style={{
          width: "42px", height: "42px",
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
