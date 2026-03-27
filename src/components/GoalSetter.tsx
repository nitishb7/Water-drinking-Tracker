import React from 'react'
import type { VolumeUnit } from '../types'
import { convertToMl, formatInputValue, getInputMin, getInputStep, getUnitLabel } from '../utils/units'

type Props = {
  goalMl: number
  unit: VolumeUnit
  onChange: (goalMl: number) => void
}

export default function GoalSetter({ goalMl, unit, onChange }: Props) {
  const [value, setValue] = React.useState(() => formatInputValue(goalMl, unit))

  React.useEffect(() => {
    setValue(formatInputValue(goalMl, unit))
  }, [goalMl, unit])

  const submit = () => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    onChange(convertToMl(parsed, unit))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <label className="label">Daily goal ({getUnitLabel(unit)})</label>
        <input
          className="input mt-2"
          type="number"
          min={getInputMin(unit)}
          step={getInputStep(unit)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button className="btn-secondary sm:min-w-[110px]" onClick={submit}>Update goal</button>
    </div>
  )
}
