import React from 'react'
import type { User } from '@instantdb/react'
import QuickAddButtons from './components/QuickAddButtons'
import IntakeHistory from './components/IntakeHistory'
import ReminderToggle from './components/ReminderToggle'
import GoalSetter from './components/GoalSetter'
import SignIn from './components/SignIn'
import RhythmBoard from './components/RhythmBoard'
import WaterFillCard from './components/WaterFillCard'
import IntakeHistoryChart from './components/IntakeHistoryChart'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useDailyReset } from './hooks/useDailyReset'
import { STORAGE_KEY } from './config'
import { toDateKey, formatTime } from './utils/date'
import type { PersistedStateV1, ReminderInterval } from './types'
import { db } from './lib/db'
import { PENDING_PROFILE_KEY } from './constants'

const MOTIVATORS = [
  'Sip regularly rather than chugging.',
  'Carry a bottle as your constant reminder.',
  'Add citrus or mint for a refreshing twist.',
  'Hydrate before you feel thirsty.',
  'Small sips throughout the day keep energy steady.',
]

const buildProfile = (email?: string | null, name?: string | null, age?: number) => ({
  name: name?.trim() || email?.split('@')[0] || 'Hydra friend',
  age: age ?? 0,
  email: email ?? '',
  provider: 'email' as const,
})

export default function App() {
  const { isLoading, user } = db.useAuth()
  if (isLoading) return null
  if (!user) return <SignIn />
  return <HydraApp user={user} />
}

function HydraApp({ user }: { user: User }) {
  const email = (user as any)?.email ?? ''
  const pendingRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    pendingRef.current = localStorage.getItem(PENDING_PROFILE_KEY)
  }, [])

  const initialState: PersistedStateV1 = {
    version: 1,
    dateKey: toDateKey(),
    goalMl: 2400,
    intakes: [],
    dailyTotals: [
      {
        dateKey: toDateKey(),
        total: 0,
      },
    ],
    goalHistory: [
      {
        dateKey: toDateKey(),
        goal: 2400,
        timestamp: Date.now(),
      },
    ],
    remindersEnabled: false,
    reminderInterval: 60,
    darkMode: false,
    profile: buildProfile(email, (user as any)?.name, (user as any)?.age),
  }

  const storageKey = `${STORAGE_KEY}_${user.id || email}`
  const [state, setState] = useLocalStorage<PersistedStateV1>(storageKey, initialState)

  const upsertGoalHistory = React.useCallback(
    (history: PersistedStateV1['goalHistory'] | undefined, dateKeyValue: string, goal: number) => {
      const base = history ? [...history] : []
      const filtered = base.filter((entry) => entry.dateKey !== dateKeyValue)
      const entry = { dateKey: dateKeyValue, goal, timestamp: Date.now() }
      return [...filtered, entry].sort((a, b) => b.timestamp - a.timestamp).slice(0, 120)
    },
    [],
  )

  const syncDailyTotals = React.useCallback(
    (
      totals: PersistedStateV1['dailyTotals'] | undefined,
      dateKeyValue: string,
      targetTotal: number,
    ): NonNullable<PersistedStateV1['dailyTotals']> => {
      const base = totals ? [...totals] : []
      const idx = base.findIndex((entry) => entry.dateKey === dateKeyValue)
      if (idx === -1) {
        base.push({ dateKey: dateKeyValue, total: targetTotal })
      } else if (base[idx].total !== targetTotal) {
        base[idx] = { ...base[idx], total: targetTotal }
      }
      return base
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-60)
    },
    [],
  )

  const applyDailyDelta = React.useCallback(
    (
      totals: PersistedStateV1['dailyTotals'] | undefined,
      dateKeyValue: string,
      delta: number,
    ): NonNullable<PersistedStateV1['dailyTotals']> => {
      const base = totals ? [...totals] : []
      const idx = base.findIndex((entry) => entry.dateKey === dateKeyValue)
      if (idx === -1) {
        base.push({ dateKey: dateKeyValue, total: Math.max(0, delta) })
      } else {
        const nextTotal = Math.max(0, base[idx].total + delta)
        base[idx] = { ...base[idx], total: nextTotal }
      }
      return base
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .slice(-60)
    },
    [],
  )

  const {
    dateKey,
    goalMl,
    intakes: storedIntakes,
    remindersEnabled,
    reminderInterval,
    darkMode,
    profile,
    goalHistory: storedGoalHistory,
    dailyTotals: storedDailyTotals,
  } = state

  const intakes = Array.isArray(storedIntakes) ? storedIntakes : []
  const goalHistory = Array.isArray(storedGoalHistory) ? storedGoalHistory : []
  const dailyTotals = Array.isArray(storedDailyTotals) ? storedDailyTotals : []

  const total = intakes.reduce((a, b) => a + b.amount, 0)
  const dailyAverage = intakes.length > 0 ? Math.round(total / intakes.length) : 0
  const percentOfGoal = goalMl > 0 ? Math.min((total / goalMl) * 100, 999) : 0
  const lastLoggedTime = intakes[0] ? formatTime(intakes[0].timestamp) : '--:--'
  const motivator = React.useMemo(() => MOTIVATORS[Math.floor(Math.random() * MOTIVATORS.length)], [])

  React.useEffect(() => {
    if (!state.goalHistory) {
      setState((s) => ({
        ...s,
        goalHistory: upsertGoalHistory([], s.dateKey, s.goalMl),
      }))
    }
  }, [state.goalHistory, setState, upsertGoalHistory])

  React.useEffect(() => {
    setState((current) => {
      const existing = current.dailyTotals ?? []
      const normalized = syncDailyTotals(
        existing,
        current.dateKey,
        current.intakes.reduce((sum, entry) => sum + entry.amount, 0),
      )
      const unchanged =
        existing.length === normalized.length &&
        existing.every(
          (entry, idx) =>
            entry.dateKey === normalized[idx]?.dateKey && entry.total === normalized[idx]?.total,
        )
      if (unchanged) return current
      return {
        ...current,
        dailyTotals: normalized,
      }
    })
  }, [setState, syncDailyTotals])

  React.useEffect(() => {
    if (!pendingRef.current) return
    try {
      const pending = JSON.parse(pendingRef.current) as { email?: string; name?: string; age?: number }
      if (!pending.email || pending.email.toLowerCase() !== email.toLowerCase()) return
      setState((s) => ({
        ...s,
        profile: buildProfile(email, pending.name, pending.age),
      }))
      localStorage.removeItem(PENDING_PROFILE_KEY)
    } catch {
      // ignore malformed payload
    }
  }, [email, setState])

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleDailyReset = React.useCallback(
    (newDate: string) => {
      setState((s) => {
        const totalsWithCurrent = syncDailyTotals(
          s.dailyTotals,
          s.dateKey,
          s.intakes.reduce((sum, entry) => sum + entry.amount, 0),
        )
        const totalsWithNewDay = syncDailyTotals(totalsWithCurrent, newDate, 0)
        return {
          ...s,
          dateKey: newDate,
          intakes: [],
          dailyTotals: totalsWithNewDay,
          goalHistory: upsertGoalHistory(s.goalHistory, newDate, s.goalMl),
        }
      })
    },
    [setState, syncDailyTotals, upsertGoalHistory],
  )

  React.useEffect(() => {
    const todayKey = toDateKey()
    if (todayKey !== dateKey) {
      handleDailyReset(todayKey)
    }
  }, [dateKey, handleDailyReset])
  useDailyReset(dateKey, handleDailyReset)

  const addIntake = (amount: number) => {
    setState((s) => {
      const entry = { id: crypto.randomUUID(), amount, timestamp: Date.now() }
      return {
        ...s,
        intakes: [entry, ...s.intakes],
        dailyTotals: applyDailyDelta(s.dailyTotals, s.dateKey, amount),
      }
    })
  }

  const removeIntake = (id: string) => {
    setState((s) => {
      const intake = s.intakes.find((entry) => entry.id === id)
      if (!intake) return s
      return {
        ...s,
        intakes: s.intakes.filter((entry) => entry.id !== id),
        dailyTotals: applyDailyDelta(s.dailyTotals, s.dateKey, -intake.amount),
      }
    })
  }

  const resetTodayIntakes = React.useCallback(() => {
    setState((s) => ({
      ...s,
      intakes: [],
      dailyTotals: syncDailyTotals(s.dailyTotals, s.dateKey, 0),
    }))
  }, [setState, syncDailyTotals])

  const onReminderChange = (enabled: boolean, interval: ReminderInterval) => {
    setState((s) => ({ ...s, remindersEnabled: enabled, reminderInterval: interval }))
  }

  const onGoalChange = React.useCallback(
    (goal: number) => {
      const normalized = Math.max(250, Math.round(goal))
      const currentDate = toDateKey()
      setState((s) => ({
        ...s,
        goalMl: normalized,
        goalHistory: upsertGoalHistory(s.goalHistory, currentDate, normalized),
      }))
    },
    [setState, upsertGoalHistory],
  )

  const toggleDark = () => setState((s) => ({ ...s, darkMode: !s.darkMode }))

  const logout = () => {
    db.auth.signOut()
    document.documentElement.classList.remove('dark')
  }

  const [section, setSection] = React.useState<'Dashboard' | 'Analytics' | 'Goals' | 'Reminders'>('Dashboard')
  const [showGoalLogs, setShowGoalLogs] = React.useState(false)

  const dailyTotalsMap = React.useMemo(() => {
    const map = new Map<string, number>()
    ;(dailyTotals ?? []).forEach((entry) => map.set(entry.dateKey, entry.total))
    map.set(dateKey, total)
    return map
  }, [dailyTotals, dateKey, total])
  const monthlyData = React.useMemo(() => {
    const monthlyMap = new Map<string, number>()
    dailyTotalsMap.forEach((value, key) => {
      const d = new Date(`${key}T00:00:00`)
      const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + value)
    })
    const result: { label: string; value: number }[] = []
    const today = new Date()
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      const sum = monthlyMap.get(monthKey) ?? 0
      result.push({
        label: date.toLocaleDateString(undefined, { month: 'short' }),
        value: sum,
      })
    }
    return result
  }, [dailyTotalsMap])
  const dailyData = React.useMemo(
    () =>
      Array.from({ length: 7 }).map((_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        const dateKeyValue = toDateKey(date)
        return {
          label: date.toLocaleDateString(undefined, { weekday: 'short' }),
          value: dailyTotalsMap.get(dateKeyValue) ?? 0,
        }
      }),
    [dailyTotalsMap],
  )
  const hourlyData = React.useMemo(() => {
    const totals = Array.from({ length: 24 }, () => 0)
    intakes.forEach((intake) => {
      const hour = new Date(intake.timestamp).getHours()
      totals[hour] += intake.amount
    })
    return totals.map((value, index) => ({
      label: index.toString().padStart(2, '0'),
      value,
    }))
  }, [intakes])

  const goalsLast30 = React.useMemo(
    () => goalHistory.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 30),
    [goalHistory],
  )
  const formatGoalDate = React.useCallback(
    (dateKeyValue: string) =>
      new Date(`${dateKeyValue}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  )
  const todayHistoryEntry = goalsLast30.find((entry) => entry.dateKey === dateKey)
  const todayFallback =
    todayHistoryEntry ?? ({ dateKey, goal: goalMl, timestamp: Date.now() } as PersistedStateV1['goalHistory'][number])
  const pastEntries = goalsLast30.filter((entry) => entry.dateKey !== todayFallback.dateKey)

  React.useEffect(() => {
    if (section !== 'Goals' && showGoalLogs) {
      setShowGoalLogs(false)
    }
  }, [section, showGoalLogs])

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-water-500 to-water-300 px-4 py-2 text-lg font-semibold text-white">
              Hydra
            </div>
            <nav className="hidden sm:flex items-center gap-3">
              {(['Dashboard', 'Analytics', 'Goals', 'Reminders'] as const).map((item) => (
                <button
                  key={item}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    section === item ? 'bg-water-100 text-water-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                  onClick={() => setSection(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary hidden sm:flex" onClick={toggleDark}>
              {darkMode ? 'Light mode' : 'Dark mode'}
            </button>
            <button className="btn-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        {section === 'Dashboard' && (
          <>
            <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div className="lg:col-span-2 xl:col-span-1 h-full">
                <WaterFillCard valueMl={total} goalMl={goalMl} className="h-full min-h-[320px] w-full" />
              </div>

              <div className="rounded-3xl bg-white p-6 shadow lg:col-span-2 xl:col-span-1 h-full">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span aria-hidden className="sr-only">
                    Intake options
                  </span>
                  <div className="flex items-center gap-2">
                    {[150, 250, 350].map((val) => (
                      <button
                        key={val}
                        className="rounded-full border border-water-200 px-3 py-1 text-water-600 text-xs font-medium hover:bg-water-50"
                        onClick={() => addIntake(val)}
                      >
                        +{val} ml
                      </button>
                    ))}
                  </div>
                </div>
                <h3 className="mt-3 text-3xl font-semibold text-slate-900">{total} ml</h3>
                <p className="mt-2 text-sm text-slate-500">Average sip size {dailyAverage} ml</p>
                <div className="mt-6 space-y-4">
                  <GoalSetter goal={goalMl} onChange={onGoalChange} />
                  <QuickAddButtons onAdd={addIntake} />
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow lg:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Reminders</span>
                  <button className="btn-secondary" onClick={resetTodayIntakes}>
                    Reset day
                  </button>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {remindersEnabled ? `Every ${reminderInterval} minutes` : 'Reminders switched off'}
                </p>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{motivator}</p>
                <div className="mt-4">
                  <ReminderToggle enabled={remindersEnabled} interval={reminderInterval} onChange={onReminderChange} />
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="rounded-3xl bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Hydration timeline</h3>
                    <p className="text-sm text-slate-500">Entries recorded today</p>
                  </div>
                  <button className="btn-secondary" onClick={resetTodayIntakes}>
                    Clear entries
                  </button>
                </div>
                <div className="mt-6 space-y-6">
                  <IntakeHistoryChart intakes={intakes} />
                  <IntakeHistory intakes={intakes} onRemove={removeIntake} />
                </div>
              </div>
            </section>
          </>
        )}

        {section === 'Analytics' && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow">
              <RhythmBoard monthlyData={monthlyData} dailyData={dailyData} hourlyData={hourlyData} />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow space-y-4">
              <div className="rounded-2xl border border-water-100 bg-water-50/80 px-4 py-3 text-sm text-water-700">
                <p className="font-semibold">Daily focus</p>
                <p>Stay hydrated steadily between meetings and workouts. Short sips beat large gulps.</p>
              </div>
              <IntakeHistory intakes={intakes} showRemove={false} />
            </div>
          </section>
        )}

        {section === 'Goals' && (
          showGoalLogs ? (
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Hydration timeline</h3>
                    <p className="text-sm text-slate-500">Focused view of today&apos;s intake</p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowGoalLogs(false)}
                  >
                    Back
                  </button>
                </div>
                <div className="mt-6 space-y-6">
                  <IntakeHistoryChart intakes={intakes} />
                  <IntakeHistory intakes={intakes} onRemove={removeIntake} />
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-10">
              <div className="space-y-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Today&apos;s log</h4>
                <div className="rounded-[32px] bg-white p-4 shadow-sm">
                  <div className="rounded-[28px] bg-gradient-to-br from-water-200 via-water-100 to-water-50 px-6 py-8 text-center shadow-inner">
                    <div className="text-4xl font-semibold text-slate-900">{todayFallback.goal} ml</div>
                    <div className="mt-2 text-sm text-water-700">Date: {formatGoalDate(todayFallback.dateKey)}</div>
                  </div>
                  <button
                    className="mx-auto mt-6 block rounded-full border border-water-200 bg-water-50 px-5 py-2 text-sm font-medium text-water-600 hover:bg-water-100"
                    onClick={() => setShowGoalLogs(true)}
                  >
                    View logs
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-water-100 text-2xl">💧</div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900">{total.toLocaleString()} ml</div>
                    <p className="text-sm text-slate-500">Goal: {goalMl.toLocaleString()} ml</p>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-semibold text-emerald-500">{percentOfGoal.toFixed(0)}%</div>
                  <p className="text-xs text-slate-500">Last logged: {lastLoggedTime}</p>
                </div>
              </div>
              <div className="space-y-5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Past logs</h4>
                {pastEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">No previous goals recorded yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {pastEntries.map((entry) => (
                      <div
                        key={`${entry.dateKey}-${entry.timestamp}`}
                        className="rounded-[28px] bg-white px-6 py-5 shadow-sm"
                      >
                        <div className="text-2xl font-semibold text-slate-900">{entry.goal} ml</div>
                        <div className="mt-1 text-sm text-slate-500">{formatGoalDate(entry.dateKey)}</div>
                        <div className="text-xs text-slate-400">
                          Updated at{' '}
                          {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        )}
      </div>
    </div>
  )
}

type GoalHistoryCardProps = {
  entry: {
    goal: number
    dateKey: string
    timestamp: number
  }
  highlighted?: boolean
  formatGoalDate: (dateKey: string) => string
}

function GoalHistoryCard({ entry, highlighted = false, formatGoalDate }: GoalHistoryCardProps) {
  return (
    <div
      className={`w-full rounded-2xl border px-6 py-5 ${
        highlighted
          ? 'border-water-400 bg-water-50 text-water-800'
          : 'border-slate-300 bg-white text-slate-700'
      }`}
    >
      <div className="text-2xl font-semibold">{entry.goal} ml</div>
      <div className={`mt-1 text-sm ${highlighted ? 'text-water-700' : 'text-slate-500'}`}>
        Date: {formatGoalDate(entry.dateKey)}
      </div>
      {!highlighted && (
        <div className="mt-1 text-xs text-slate-400">
          Updated at {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  )
}









