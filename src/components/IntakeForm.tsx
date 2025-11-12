import React from 'react'

type Props = {
  onAdd: (amount: number) => void
}

export default function IntakeForm({ onAdd }: Props) {
  const [amount, setAmount] = React.useState<string>('')

  return (
    <form
      className="card flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        const parsed = Number.parseFloat(amount)
        if (!Number.isFinite(parsed) || parsed <= 0) return
        onAdd(parsed)
        setAmount('')
      }}
    >
      <div className="grow">
        <label className="label">Add water</label>
        <input
          className="input"
          type="number"
          min="0.01"
          step="any"
          inputMode="decimal"
          placeholder="e.g. 300"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button className="btn-primary" type="submit">Log</button>
    </form>
  )
}
