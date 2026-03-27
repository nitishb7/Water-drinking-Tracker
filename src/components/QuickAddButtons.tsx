import React from 'react'
import type { VolumeUnit } from '../types'
import { convertToMl, formatVolume, getInputMin, getInputStep, getUnitLabel } from '../utils/units'

type Props = {
  unit: VolumeUnit
  onAdd: (amountMl: number) => void
}

const presets = [250, 500, 750]

export default function QuickAddButtons({ unit, onAdd }: Props) {
  const [custom, setCustom] = React.useState<string>('')

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted">Quick add</div>
      <div className="flex flex-wrap gap-2">
        {presets.map((ml) => (
          <button key={ml} className="btn-secondary" onClick={() => onAdd(ml)}>
            +{formatVolume(ml, unit, { compact: true })}
          </button>
        ))}
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const parsed = Number.parseFloat(custom)
            if (!Number.isFinite(parsed) || parsed <= 0) return
            onAdd(convertToMl(parsed, unit))
            setCustom('')
          }}
        >
          <input
            className="input w-32"
            type="number"
            min={getInputMin(unit)}
            step={getInputStep(unit)}
            inputMode="decimal"
            placeholder={`Custom ${getUnitLabel(unit)}`}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button className="btn-primary" type="submit">Add</button>
        </form>
      </div>
    </div>
  )
}
