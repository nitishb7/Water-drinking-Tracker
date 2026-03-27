import React from 'react'
import { formatTime } from '../utils/date'
import type { Intake, VolumeUnit } from '../types'
import { formatVolume } from '../utils/units'

type Props = {
  intakes: Intake[]
  unit: VolumeUnit
  onRemove?: (id: string) => void
  title?: string
  showRemove?: boolean
}

export default function IntakeHistory({ intakes, unit, onRemove, title = "Today's log", showRemove = true }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-soft">{title}</p>
      {intakes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-soft dark:border-slate-700">
          No entries yet. Log your first glass to start the day.
        </div>
      ) : (
        <ul className="rounded-[28px] border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {intakes.map((entry, idx) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between px-4 py-3 ${idx !== intakes.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-water-50">
                  <span className="h-3 w-3 rounded-full bg-water-500" />
                </div>
                <div>
                  <div className="text-base font-semibold text-main">{formatVolume(entry.amount, unit)}</div>
                  <div className="text-xs text-soft">Logged at {formatTime(entry.timestamp)}</div>
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-muted">
                {formatTime(entry.timestamp)}
                {onRemove && showRemove && (
                  <button
                    className="ml-4 text-xs font-medium text-water-600 hover:text-water-700 dark:text-water-300 dark:hover:text-water-200"
                    onClick={() => onRemove(entry.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
