import React from 'react'

type Props = {
  goal: number
  onChange: (goal: number) => void
}

export default function GoalSetter({ goal, onChange }: Props) {
  const [value, setValue] = React.useState(goal)
  React.useEffect(() => setValue(goal), [goal])

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <label className="label">Daily goal (ml)</label>
        <input
          className="input mt-2"
          type="number"
          min={250}
          step={50}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
      <button className="btn-secondary sm:min-w-[110px]" onClick={() => onChange(value)}>Update goal</button>
    </div>
  )
}
