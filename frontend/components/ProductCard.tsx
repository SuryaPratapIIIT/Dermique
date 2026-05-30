interface Props {
  name: string
  category: string
  reason: string
  rating: string
  product_url: string
  image_url?: string
  note?: string
}

export default function ProductCard({ name, category, reason, rating, product_url, note }: Props) {
  const hasUrl = product_url && product_url.startsWith("http")

  return (
    <div style={{
      width: "260px", flexShrink: 0,
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(255,255,255,0.95)",
      borderRadius: "20px",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
      backdropFilter: "blur(10px)",
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.1)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)"; }}
    >
      {/* Coloured header band */}
      <div style={{
        height: "90px",
        background: "linear-gradient(135deg, rgba(236,72,153,0.12), rgba(167,139,250,0.12))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "36px",
      }}>
        🧴
      </div>

      <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        {/* Category + rating row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: "11px", color: "#ec4899", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.5px"
          }}>
            {category || "Skincare"}
          </span>
          {rating && (
            <span style={{
              fontSize: "12px", color: "#888", fontWeight: 600,
              background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: "20px"
            }}>
              ★ {rating}
            </span>
          )}
        </div>

        {/* Product name */}
        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", lineHeight: "1.35", margin: 0 }}>
          {name}
        </h3>

        {/* Reason */}
        {reason && (
          <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.5", margin: 0 }}>
            {reason.length > 90 ? reason.slice(0, 87) + "…" : reason}
          </p>
        )}

        {/* Note/warning */}
        {note && note.toLowerCase() !== "none" && (
          <div style={{
            fontSize: "11px", color: "#d97706",
            background: "rgba(245,158,11,0.1)", padding: "6px 10px",
            borderRadius: "8px", fontWeight: 500
          }}>
            ⚠️ {note}
          </div>
        )}

        {/* CTA Button */}
        <div style={{ marginTop: "auto", paddingTop: "4px" }}>
          {hasUrl ? (
            <a
              href={product_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "linear-gradient(135deg, #ec4899, #f472b6)",
                color: "#fff",
                textAlign: "center",
                padding: "10px 16px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(236,72,153,0.35)",
                transition: "opacity 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              View Product →
            </a>
          ) : (
            <div style={{
              display: "block",
              background: "rgba(0,0,0,0.06)",
              color: "#aaa",
              textAlign: "center",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 600,
            }}>
              Link unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
