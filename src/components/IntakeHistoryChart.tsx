import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { Intake } from '../types'
import { formatTime } from '../utils/date'

type Props = {
  intakes: Intake[]
}

const buildChartData = (intakes: Intake[]) => {
  const sorted = [...intakes].sort((a, b) => a.timestamp - b.timestamp)
  let cumulative = 0
  return sorted.map((entry) => {
    cumulative += entry.amount
    return {
      time: formatTime(entry.timestamp),
      amount: entry.amount,
      total: cumulative,
    }
  })
}

export default function IntakeHistoryChart({ intakes }: Props) {
  const data = React.useMemo(() => buildChartData(intakes), [intakes])

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-water-200 px-6 py-10 text-center text-sm text-slate-500">
        Logged intakes will appear on this chart as you add them.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 4, bottom: 16 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 12 }} angle={-35} textAnchor="end" height={50} />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 12 }}
            width={60}
            tickFormatter={(value) => `${value}`}
            label={{ value: 'ml', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748B' }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: '#bfdbfe' }}
            formatter={(value: number, name) => [`${value} ml`, name === 'total' ? 'Total' : 'Amount']}
            labelFormatter={(label) => `Time ${label}`}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#1b87df"
            strokeWidth={3}
            dot={{ r: 3, stroke: '#1b87df', strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
