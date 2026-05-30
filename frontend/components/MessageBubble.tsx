"use client"
import { Message } from "@/types"
import ReactMarkdown from "react-markdown"
import ProductCard from "./ProductCard"

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <div style={{
        display: "flex", justifyContent: "flex-end",
        alignItems: "flex-end", gap: "10px", marginBottom: "20px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #ec4899, #f472b6)",
          color: "#fff", padding: "14px 20px",
          borderRadius: "20px 20px 6px 20px",
          maxWidth: "65%", fontSize: "15px", lineHeight: "1.5", fontWeight: 500,
          boxShadow: "0 4px 20px rgba(236,72,153,0.35)",
        }}>
          {message.content}
        </div>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #a78bfa, #ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "15px", boxShadow: "0 2px 10px rgba(167,139,250,0.4)",
        }}>
          👤
        </div>
      </div>
    )
  }

  // ── Assistant ──
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
        {/* Glass orb avatar */}
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
          background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, rgba(255,182,255,0.6) 40%, rgba(135,206,250,0.5) 65%, rgba(236,72,153,0.7) 100%)",
          border: "1px solid rgba(255,255,255,0.8)", position: "relative",
          boxShadow: "0 4px 14px rgba(236,72,153,0.2)",
        }}>
          <div style={{
            position: "absolute", top: "15%", left: "18%",
            width: "30%", height: "18%",
            background: "rgba(255,255,255,0.9)", borderRadius: "50%", transform: "rotate(-35deg)"
          }} />
        </div>

        {/* Bubble */}
        <div style={{
          background: "rgba(255,255,255,0.82)", color: "#1a1a1a",
          padding: "16px 22px", borderRadius: "20px 20px 20px 6px",
          maxWidth: "78%", fontSize: "15px", lineHeight: "1.65",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.9)",
        }}>
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Product cards (Directly from structured response) */}
      {message.products && message.products.length > 0 && (
        <div style={{
          display: "flex", gap: "16px", overflowX: "auto",
          padding: "16px 4px 4px 46px", marginTop: "4px",
        }} className="no-scrollbar">
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
