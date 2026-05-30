"use client"
import { SkinProfile } from "@/types"

interface Props {
  profile: SkinProfile | null
  agentState: string
}

export default function SkinProfileSidebar({ profile, agentState }: Props) {
  const stateConfig: Record<string, {dot: string, text: string}> = {
    INTAKE: { dot: "🟡", text: "Understanding your skin" },
    RECOMMENDING: { dot: "🔵", text: "Searching products..." },
    DONE: { dot: "🟢", text: "Recommendations ready" }
  }
  const status = stateConfig[agentState] || stateConfig.INTAKE

  return (
    <div style={{
      width: "260px", minHeight: "100vh",
      background: "#0A0A0A",
      borderRight: "1px solid #2C2C2E",
      padding: "28px 20px",
      display: "flex", flexDirection: "column", gap: "20px",
      flexShrink: 0
    }}
    className="sidebar-hide-mobile">
      <div>
        <span style={{color: "#FFFFFF", fontSize: "22px", fontWeight: "700"}}>
          Dermiq
        </span>
        <span style={{color: "#D85A30", fontSize: "22px"}}> ●</span>
      </div>

      <hr style={{borderColor: "#2C2C2E"}}/>

      <div>
        <p style={{color: "#666", fontSize: "10px",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px"}}>
          Agent Status
        </p>
        <p style={{color: "#FFFFFF", fontSize: "13px"}}>
          {status.dot} {status.text}
        </p>
      </div>

      <hr style={{borderColor: "#2C2C2E"}}/>

      <div>
        <p style={{color: "#666", fontSize: "10px",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px"}}>
          Skin Profile
        </p>
        {!profile ? (
          <p style={{color: "#555", fontSize: "13px", fontStyle: "italic"}}>
            Will appear after your first message
          </p>
        ) : (
          <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
            <div>
              <span style={{
                background: "#D85A30", color: "#FFFFFF",
                borderRadius: "50px", padding: "4px 12px",
                fontSize: "12px", fontWeight: "500",
                textTransform: "capitalize"
              }}>
                {profile.skin_type}
              </span>
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: "6px"}}>
              {profile.concerns?.map(c => (
                <span key={c} style={{
                  background: "#2C2C2E", color: "#AAAAAA",
                  borderRadius: "50px", padding: "3px 10px",
                  fontSize: "11px", textTransform: "capitalize"
                }}>
                  {c}
                </span>
              ))}
            </div>
            {profile.sensitivities?.length > 0 &&
              profile.sensitivities[0] !== "none" && (
              <div style={{display: "flex", flexWrap: "wrap", gap: "6px"}}>
                {profile.sensitivities.map(s => (
                  <span key={s} style={{
                    background: "#2A1010", color: "#FF6B6B",
                    borderRadius: "50px", padding: "3px 10px",
                    fontSize: "11px", textTransform: "capitalize"
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
            {profile.age_range && (
              <p style={{color: "#666", fontSize: "12px"}}>
                Age: {profile.age_range}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{marginTop: "auto"}}>
        <p style={{color: "#333", fontSize: "11px"}}>
          Powered by Groq + Pinecone
        </p>
      </div>
    </div>
  )
}
