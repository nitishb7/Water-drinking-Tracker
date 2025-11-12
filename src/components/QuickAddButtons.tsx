import React from 'react'

type Props = {
  onAdd: (amount: number) => void
}

const presets = [250, 500, 750]

export default function QuickAddButtons({ onAdd }: Props) {
  const [custom, setCustom] = React.useState<string>('')

  return (
    <div className="card">
      <div className="mb-2 font-medium">Quick Add</div>
      <div className="flex flex-wrap gap-2">
        {presets.map((ml) => (
          <button key={ml} className="btn-secondary" onClick={() => onAdd(ml)}>
            +{ml}ml
          </button>
        ))}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const parsed = Number.parseFloat(custom)
            if (!Number.isFinite(parsed) || parsed <= 0) return
            onAdd(parsed)
            setCustom('')
          }}
        >
          <input
            className="input w-28"
            type="number"
            min="0.01"
            step="any"
            inputMode="decimal"
            placeholder="Custom"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button className="btn-primary" type="submit">Add</button>
        </form>
      </div>
    </div>
  )
}
