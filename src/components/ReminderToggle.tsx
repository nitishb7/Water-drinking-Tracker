import React from 'react'
import type { ReminderInterval } from '../types'
import { useReminders } from '../hooks/useReminders'

type Props = {
  enabled: boolean
  interval: ReminderInterval
  onChange: (enabled: boolean, interval: ReminderInterval) => void
}

export default function ReminderToggle({ enabled, interval, onChange }: Props) {
  const [sound, setSound] = React.useState(false)
  const { request } = useReminders({
    shouldRemind: enabled,
    interval,
    title: 'Hydration Reminder',
    body: 'Sip some water and stay hydrated!',
    sound,
  })

  const onToggle = async () => {
    if (!enabled) {
      const permission = await request()
      if (permission === 'denied') {
        // sound can still be used while the page stays open
      }
    }
    onChange(!enabled, interval)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-main">Reminders</div>
          <div className="mt-1 text-sm text-soft">
            {enabled ? `Every ${interval || 0} min` : 'Off'}
          </div>
        </div>
        <button className={enabled ? 'btn-primary' : 'btn-secondary'} onClick={onToggle}>
          {enabled ? 'Enabled' : 'Enable'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-end">
        <div>
          <label className="label">Interval</label>
          <select
            className="input mt-2"
            value={interval}
            onChange={(e) => onChange(enabled, Number(e.target.value) as ReminderInterval)}
          >
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted dark:border-slate-700 dark:bg-slate-800">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          Play a sound while this tab is open
        </label>
      </div>
    </div>
  )
}
