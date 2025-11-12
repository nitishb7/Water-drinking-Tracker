import React from 'react'
import { formatTime } from '../utils/date'
import type { Intake } from '../types'

type Props = {
  intakes: Intake[]
  onRemove?: (id: string) => void
  title?: string
  showRemove?: boolean
}

export default function IntakeHistory({ intakes, onRemove, title = "Today's log", showRemove = true }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</p>
      {intakes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          No intakes yet. Log your first sip 💧
        </div>
      ) : (
        <ul className="rounded-[28px] border border-slate-100 bg-white shadow-sm">
          {intakes.map((entry, idx) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between px-4 py-3 ${idx !== intakes.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-water-50 text-water-600">
                  💧
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">{entry.amount} ml</div>
                  <div className="text-xs text-slate-500">{formatTime(entry.timestamp)}</div>
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-slate-600">
                {formatTime(entry.timestamp)}
                {onRemove && showRemove && (
                  <button
                    className="ml-4 text-xs font-medium text-water-600 hover:text-water-700"
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
