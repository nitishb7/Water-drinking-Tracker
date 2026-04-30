import React from 'react'
import type { VolumeUnit } from '../types'
import { formatVolume } from '../utils/units'

type Props = {
  valueMl: number
  goalMl: number
  unit: VolumeUnit
  title?: string
  className?: string
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export default function WaterFillCard({
  valueMl,
  goalMl,
  unit,
  title = 'Daily water',
  className = '',
}: Props) {
  const pct = goalMl ? clamp((valueMl / goalMl) * 100) : 0
  const excess = goalMl ? Math.max(valueMl - goalMl, 0) : 0

  return (
    <div
      className={`water-card relative overflow-hidden rounded-lg text-white ${className}`}
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-2">
          <span className="text-5xl font-bold tracking-tight sm:text-6xl">{formatVolume(valueMl, unit, { compact: true })}</span>
          <span className="text-xl/none opacity-75 sm:text-2xl/none">/ {formatVolume(goalMl, unit, { compact: true })}</span>
        </div>
        <div className="mt-1 text-base opacity-80 sm:text-lg">{formatVolume(goalMl, unit)} target</div>
        {excess > 0 && (
          <div className="mt-2 text-sm font-medium text-white/90">
            +{formatVolume(excess, unit, { compact: true })} above goal
          </div>
        )}
      </div>
    </div>
  )
}
