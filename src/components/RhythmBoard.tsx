import React from 'react'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import type { VolumeUnit } from '../types'
import { formatVolume, getUnitLabel } from '../utils/units'

type Point = { label: string; value: number }
type Props = {
  monthlyData: Point[]
  dailyData: Point[]
  hourlyData: Point[]
  unit: VolumeUnit
  darkMode?: boolean
}

const VIEWS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'daily', label: 'Daily' },
  { id: 'hourly', label: 'Hourly' },
] as const

export default function RhythmBoard({ monthlyData, dailyData, hourlyData, unit, darkMode = false }: Props) {
  const [view, setView] = React.useState<typeof VIEWS[number]['id']>('monthly')
  const data = view === 'monthly' ? monthlyData : view === 'daily' ? dailyData : hourlyData
  const gridStroke = darkMode ? '#334155' : '#e2e8f0'
  const tickFill = darkMode ? '#94a3b8' : '#64748B'
  const labelFill = darkMode ? '#cbd5e1' : '#334155'
  const tooltipStyle = {
    borderRadius: 12,
    borderColor: darkMode ? '#334155' : '#bfdbfe',
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    color: darkMode ? '#e2e8f0' : '#0f172a',
  }
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props
    if (value == null || value <= 0) return null
    const labelX = x + width / 2
    const labelY = y - 8
    const displayValue = Number.isFinite(value) ? formatVolume(Number(value), unit, { compact: true }) : value
    return (
      <text x={labelX} y={labelY} textAnchor="middle" fill={labelFill} fontSize={12} fontWeight={500}>
        {displayValue}
      </text>
    )
  }

  const chartBody =
    view === 'daily' ? (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 32, right: 24, left: 8, bottom: 32 }} barGap={12}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: tickFill, fontSize: 12 }}
              label={{ value: 'Day of week', position: 'insideBottom', offset: -18, fill: tickFill }}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 12 }}
              width={64}
              tickFormatter={(value) => formatVolume(Number(value), unit, { compact: true })}
              label={{ value: `Water (${getUnitLabel(unit)})`, angle: -90, position: 'insideLeft', offset: 5, dy: 45, fill: tickFill }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(123, 136, 255, 0.08)' }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatVolume(value, unit), 'Total']}
            />
            <Bar dataKey="value" fill="#1b87df" radius={[12, 12, 0, 0]} maxBarSize={56}>
              <LabelList dataKey="value" content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : view === 'monthly' ? (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 32, right: 24, left: 8, bottom: 32 }} barGap={18}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: tickFill, fontSize: 12 }}
              label={{ value: 'Month', position: 'insideBottom', offset: -18, fill: tickFill }}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 12 }}
              width={70}
               tickFormatter={(value) => formatVolume(Number(value), unit, { compact: true })}
               label={{ value: `Water (${getUnitLabel(unit)})`, angle: -90, position: 'insideLeft', offset: 5, dy: 45, fill: tickFill }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(123, 136, 255, 0.08)' }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatVolume(value, unit), 'Total']}
            />
            <Bar dataKey="value" fill="#1b87df" radius={[12, 12, 0, 0]} maxBarSize={56}>
              <LabelList dataKey="value" content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 32 }} barCategoryGap="20%" barGap={3}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: tickFill, fontSize: 10 }}
              label={{ value: 'Hour', position: 'insideBottom', offset: -20, fill: tickFill }}
            />
            <YAxis
              tick={{ fill: tickFill, fontSize: 12 }}
              width={56}
               tickFormatter={(value) => formatVolume(Number(value), unit, { compact: true })}
               label={{ value: `Water (${getUnitLabel(unit)})`, angle: -90, position: 'insideLeft', offset: 5, dy: 45, fill: tickFill }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(27,135,223,0.08)' }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatVolume(value, unit), 'Total']}
              labelFormatter={(label) => `${label}:00`}
            />
            <Bar dataKey="value" fill="#1b87df" radius={[10, 10, 0, 0]} maxBarSize={32}>
              <LabelList dataKey="value" content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-main">Hydration rhythm</h3>
          <p className="text-sm text-soft">
            {view === 'monthly' && 'Consistency across months'}
            {view === 'daily' && 'Performance each day of this week'}
            {view === 'hourly' && 'Hourly intake distribution'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <div className="flex items-center gap-1">
            {VIEWS.map((option) => (
              <button
                key={option.id}
                className={`rounded-md px-3 py-1 transition ${
                  view === option.id ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
                onClick={() => setView(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartBody}

      <div className="rounded-md border border-slate-200 bg-white px-4 py-1 text-xs text-soft dark:border-slate-800 dark:bg-slate-950">
        Showing {view === 'monthly' ? '6 months' : view === 'daily' ? '7 daily snapshots' : '24 hourly slots'}
      </div>
    </div>
  )
}

