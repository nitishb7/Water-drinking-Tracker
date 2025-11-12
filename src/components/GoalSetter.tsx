import React from 'react'

type Props = {
  goal: number
  onChange: (goal: number) => void
}

export default function GoalSetter({ goal, onChange }: Props) {
  const [value, setValue] = React.useState(goal)
  React.useEffect(() => setValue(goal), [goal])

  return (
    <div className="flex items-end gap-2">
      <div className="grow">
        <label className="label">Daily goal (ml)</label>
        <input
          className="input"
          type="number"
          min={250}
          step={50}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
      <button className="btn-secondary" onClick={() => onChange(value)}>Set</button>
    </div>
  )
}
