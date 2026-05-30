"use client"
import Lottie from "lottie-react"
import { useEffect, useState } from "react"

interface Props {
  size?: number
  isPulsing?: boolean
}

export default function AnimatedOrb({ size = 200, isPulsing = false }: Props) {
  const [animData, setAnimData] = useState(null)

  useEffect(() => {
    // Load Lottie JSON from lottiefiles CDN
    // Use this exact free animation — AI sphere orb
    fetch("https://assets2.lottiefiles.com/packages/lf20_qm8eqzse.json")
      .then(r => r.json())
      .then(data => setAnimData(data))
      .catch(() => setAnimData(null))
  }, [])

  const pulseStyle = isPulsing ? {
    animation: "pulse 1.5s ease-in-out infinite"
  } : {}

  if (!animData) {
    // Fallback SVG orb if Lottie fails to load
    return (
      <div style={{width: size, height: size, ...pulseStyle}}>
        <svg viewBox="0 0 120 120" width={size} height={size}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <style>{`
            @keyframes spin1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes spin2 { from{transform:rotate(60deg)} to{transform:rotate(420deg)} }
            @keyframes spin3 { from{transform:rotate(120deg)} to{transform:rotate(480deg)} }
            @keyframes spin4 { from{transform:rotate(180deg)} to{transform:rotate(540deg)} }
            .e1{transform-origin:60px 60px; animation:spin1 8s linear infinite}
            .e2{transform-origin:60px 60px; animation:spin2 8s linear infinite}
            .e3{transform-origin:60px 60px; animation:spin3 8s linear infinite}
            .e4{transform-origin:60px 60px; animation:spin4 8s linear infinite}
          `}</style>
          <ellipse className="e1" cx="60" cy="60" rx="55" ry="18"
            stroke="white" strokeOpacity="0.7" strokeWidth="0.8" fill="none"
            filter="url(#glow)"/>
          <ellipse className="e2" cx="60" cy="60" rx="55" ry="18"
            stroke="white" strokeOpacity="0.5" strokeWidth="0.8" fill="none"
            filter="url(#glow)"/>
          <ellipse className="e3" cx="60" cy="60" rx="55" ry="18"
            stroke="white" strokeOpacity="0.6" strokeWidth="0.8" fill="none"
            filter="url(#glow)"/>
          <ellipse className="e4" cx="60" cy="60" rx="55" ry="18"
            stroke="white" strokeOpacity="0.4" strokeWidth="0.8" fill="none"
            filter="url(#glow)"/>
          <circle cx="60" cy="60" r="4" fill="white" opacity="0.8"
            filter="url(#glow)"/>
        </svg>
      </div>
    )
  }

  return (
    <div style={{width: size, height: size, ...pulseStyle}}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
      <Lottie
        animationData={animData}
        loop={true}
        style={{width: size, height: size}}
      />
    </div>
  )
}
