import React from 'react'

type Props = {
  valueMl: number
  goalMl: number
  title?: string
  className?: string
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export default function WaterFillCard({
  valueMl,
  goalMl,
  title = 'Daily water',
  className = '',
}: Props) {
  const pct = goalMl ? clamp((valueMl / goalMl) * 100) : 0

  const liters = valueMl / 1000
  const excess = goalMl ? Math.max(valueMl - goalMl, 0) : 0

  return (
    <div
      className={`water-card relative overflow-hidden rounded-3xl text-white shadow-xl ${className}`}
      style={{ ['--fill' as any]: `${pct}%` }}
      aria-label={`Water intake ${Math.round(pct)} percent of goal`}
      role="img"
    >
      <div className="absolute left-5 top-5 z-10 text-sm font-semibold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        {title}
      </div>

      <div className="wave-clip absolute inset-0 z-0">
        <div className="wave-fill">
          <div className="wave-static" aria-hidden />
          <div className="wave-crest" aria-hidden />
        </div>
      </div>

      <div className="pointer-events-none absolute left-6 bottom-6 z-10 leading-tight text-white drop-shadow">
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold tracking-tight">{Math.round(valueMl)}</span>
          <span className="text-2xl/none opacity-75">/{Math.round(goalMl)} ml</span>
        </div>
        <div className="mt-1 text-lg opacity-80">{liters.toFixed(1)} liters</div>
        {excess > 0 && (
          <div className="mt-2 text-sm font-medium text-white/90">
            +{Math.round(excess)} ml more than the goal
          </div>
        )}
      </div>
    </div>
  )
}
