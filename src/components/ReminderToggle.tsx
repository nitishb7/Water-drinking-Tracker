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
    title: 'Hydration Reminder 💧',
    body: 'Sip some water and stay hydrated!',
    sound,
  })

  const onToggle = async () => {
    if (!enabled) {
      const p = await request()
      if (p === 'denied') {
        // still allow in-app sound reminders
      }
    }
    onChange(!enabled, interval)
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Reminders</div>
          <div className="text-sm text-slate-500 dark:text-slate-300">
            {enabled ? `Every ${interval || 0} min` : 'Off'}
          </div>
        </div>
        <button className={enabled ? 'btn-primary' : 'btn-secondary'} onClick={onToggle}>
          {enabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <label className="label">Interval</label>
        <select
          className="input w-40"
          value={interval}
          onChange={(e) => onChange(enabled, Number(e.target.value) as ReminderInterval)}
        >
          <option value={30}>30 min</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> sound
        </label>
      </div>
    </div>
  )
}
