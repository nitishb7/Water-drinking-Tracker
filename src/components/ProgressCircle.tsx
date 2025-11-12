import React from 'react'

type Props = {
  total: number
  goal: number
  size?: number
  strokeWidth?: number
}

export default function ProgressCircle({ total, goal, size = 180, strokeWidth = 10 }: Props) {
  const pct = Math.min(1, goal ? total / goal : 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * pct

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5cc8ff" />
            <stop offset="100%" stopColor="#1aa3e6" />
          </linearGradient>
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-water-200 dark:text-slate-700"
          fill="none"
        />
        {/* glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#ringGrad)"
          opacity={0.2}
          fill="none"
          filter="url(#ringGlow)"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="url(#ringGrad)"
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight">{Math.min(total, goal)}<span className="text-slate-400 text-lg">ml</span></div>
          <div className="text-xs text-slate-500 dark:text-slate-300">{Math.round(pct * 100)}% of {goal}ml</div>
        </div>
      </div>
    </div>
  )
}
