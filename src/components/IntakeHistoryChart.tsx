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
import type { Intake, VolumeUnit } from '../types'
import { formatTime } from '../utils/date'
import { formatVolume, getUnitLabel } from '../utils/units'

type Props = {
  intakes: Intake[]
  unit: VolumeUnit
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

export default function IntakeHistoryChart({ intakes, unit }: Props) {
  const data = React.useMemo(() => buildChartData(intakes), [intakes])
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const gridStroke = isDark ? '#334155' : '#e2e8f0'
  const tickFill = isDark ? '#94a3b8' : '#64748B'
  const tooltipStyle = {
    borderRadius: 12,
    borderColor: isDark ? '#334155' : '#bfdbfe',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#0f172a',
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-water-200 px-6 py-10 text-center text-sm text-soft dark:border-water-900/40">
        Logged intakes will appear on this chart as you add them.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 20, bottom: 16 }}>
          <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" />
          <XAxis dataKey="time" tick={{ fill: tickFill, fontSize: 12 }} angle={-35} textAnchor="end" height={50} />
          <YAxis
            tick={{ fill: tickFill, fontSize: 12 }}
            width={76}
            tickFormatter={(value) => formatVolume(Number(value), unit, { compact: true })}
            label={{ value: getUnitLabel(unit), angle: -90, position: 'insideLeft', offset: 0, dx: -8, fill: tickFill }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name) => [formatVolume(value, unit), name === 'total' ? 'Total' : 'Amount']}
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
