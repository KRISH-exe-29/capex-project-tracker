import React, { useState } from 'react'

/**
 * INDO TECH wordmark. Uses the official artwork at /indotech-logo.png when it is present in
 * `public/`; otherwise draws a vector version (white heavy capitals on brand red).
 */
export const Logo: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const [useVector, setUseVector] = useState(false)

  if (collapsed) {
    return (
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" role="img" aria-label="INDO TECH">
        <rect width="40" height="40" rx="8" fill="#ED1C24" />
        <text
          x="20"
          y="27"
          textAnchor="middle"
          fill="#fff"
          fontFamily="'Arial Black', 'Segoe UI Black', Impact, sans-serif"
          fontSize="17"
          fontWeight="900"
        >
          IT
        </text>
      </svg>
    )
  }

  if (!useVector) {
    return (
      <img
        src="/indotech-logo.png"
        alt="INDO TECH"
        onError={() => setUseVector(true)}
        className="h-8 w-auto max-w-[168px] rounded-[4px] object-contain"
      />
    )
  }

  return (
    <svg viewBox="0 0 200 34" className="h-8 w-[168px] shrink-0" role="img" aria-label="INDO TECH">
      <rect width="200" height="34" rx="4" fill="#ED1C24" />
      <text
        x="100"
        y="25"
        textAnchor="middle"
        textLength="176"
        lengthAdjust="spacingAndGlyphs"
        fill="#fff"
        fontFamily="'Arial Black', 'Segoe UI Black', Impact, sans-serif"
        fontSize="21"
        fontWeight="900"
      >
        INDO TECH
      </text>
    </svg>
  )
}
