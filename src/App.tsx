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
import type { PersistedStateV1, ReminderInterval, VolumeUnit } from './types'
import { db } from './lib/db'
import { PENDING_PROFILE_KEY } from './constants'
import { VOLUME_UNITS, formatVolume, getUnitLabel } from './utils/units'

const MOTIVATORS = [
  'Build hydration around small, repeatable habits.',
  'Keep water nearby so logging stays effortless.',
  'Consistency matters more than catching up late.',
  'A calm routine usually beats a strict one.',
]

const SECTION_META = {
  Dashboard: ['Overview', 'A focused workspace for logging water and checking today at a glance.'],
  Analytics: ['Insights', 'Review weekly, monthly, and hourly hydration patterns.'],
  Goals: ['Targets', 'Manage the current goal and keep a simple record of changes.'],
  Reminders: ['Routine', 'Control reminders, theme, and daily reset actions in one place.'],
} as const

type SectionKey = keyof typeof SECTION_META

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
    dailyTotals: [{ dateKey: toDateKey(), total: 0 }],
    goalHistory: [{ dateKey: toDateKey(), goal: 2400, timestamp: Date.now() }],
    remindersEnabled: false,
    reminderInterval: 60,
    darkMode: false,
    volumeUnit: 'ml',
    profile: buildProfile(email, (user as any)?.name, (user as any)?.age),
  }

  const storageKey = `${STORAGE_KEY}_${user.id || email}`
  const [state, setState] = useLocalStorage<PersistedStateV1>(storageKey, initialState)

  const upsertGoalHistory = React.useCallback((history: PersistedStateV1['goalHistory'] | undefined, dateKeyValue: string, goal: number) => {
    const base = history ? [...history] : []
    const filtered = base.filter((entry) => entry.dateKey !== dateKeyValue)
    return [...filtered, { dateKey: dateKeyValue, goal, timestamp: Date.now() }].sort((a, b) => b.timestamp - a.timestamp).slice(0, 120)
  }, [])

  const syncDailyTotals = React.useCallback((totals: PersistedStateV1['dailyTotals'] | undefined, dateKeyValue: string, targetTotal: number): NonNullable<PersistedStateV1['dailyTotals']> => {
    const base = totals ? [...totals] : []
    const idx = base.findIndex((entry) => entry.dateKey === dateKeyValue)
    if (idx === -1) base.push({ dateKey: dateKeyValue, total: targetTotal })
    else if (base[idx].total !== targetTotal) base[idx] = { ...base[idx], total: targetTotal }
    return base.sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(-60)
  }, [])

  const applyDailyDelta = React.useCallback((totals: PersistedStateV1['dailyTotals'] | undefined, dateKeyValue: string, delta: number): NonNullable<PersistedStateV1['dailyTotals']> => {
    const base = totals ? [...totals] : []
    const idx = base.findIndex((entry) => entry.dateKey === dateKeyValue)
    if (idx === -1) base.push({ dateKey: dateKeyValue, total: Math.max(0, delta) })
    else base[idx] = { ...base[idx], total: Math.max(0, base[idx].total + delta) }
    return base.sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(-60)
  }, [])

  const { dateKey, goalMl, intakes: storedIntakes, remindersEnabled, reminderInterval, darkMode, profile, goalHistory: storedGoalHistory, dailyTotals: storedDailyTotals } = state
  const volumeUnit = state.volumeUnit ?? 'ml'
  const intakes = Array.isArray(storedIntakes) ? storedIntakes : []
  const goalHistory = Array.isArray(storedGoalHistory) ? storedGoalHistory : []
  const dailyTotals = Array.isArray(storedDailyTotals) ? storedDailyTotals : []

  const total = intakes.reduce((sum, entry) => sum + entry.amount, 0)
  const dailyAverage = intakes.length > 0 ? Math.round(total / intakes.length) : 0
  const percentOfGoal = goalMl > 0 ? Math.min((total / goalMl) * 100, 100) : 0
  const remainingMl = Math.max(goalMl - total, 0)
  const surplusMl = Math.max(total - goalMl, 0)
  const lastLoggedTime = intakes[0] ? formatTime(intakes[0].timestamp) : '--:--'
  const motivator = React.useMemo(() => MOTIVATORS[Math.floor(Math.random() * MOTIVATORS.length)], [])
  const formatDisplay = React.useCallback(
    (valueMl: number, compact = false) => formatVolume(valueMl, volumeUnit, { compact }),
    [volumeUnit],
  )

  React.useEffect(() => {
    if (!state.goalHistory) setState((current) => ({ ...current, goalHistory: upsertGoalHistory([], current.dateKey, current.goalMl) }))
  }, [state.goalHistory, setState, upsertGoalHistory])

  React.useEffect(() => {
    if (!state.volumeUnit) setState((current) => ({ ...current, volumeUnit: 'ml' }))
  }, [state.volumeUnit, setState])

  React.useEffect(() => {
    setState((current) => {
      const existing = current.dailyTotals ?? []
      const normalized = syncDailyTotals(existing, current.dateKey, current.intakes.reduce((sum, entry) => sum + entry.amount, 0))
      const unchanged = existing.length === normalized.length && existing.every((entry, idx) => entry.dateKey === normalized[idx]?.dateKey && entry.total === normalized[idx]?.total)
      return unchanged ? current : { ...current, dailyTotals: normalized }
    })
  }, [setState, syncDailyTotals])

  React.useEffect(() => {
    if (!pendingRef.current) return
    try {
      const pending = JSON.parse(pendingRef.current) as { email?: string; name?: string; age?: number }
      if (!pending.email || pending.email.toLowerCase() !== email.toLowerCase()) return
      setState((current) => ({ ...current, profile: buildProfile(email, pending.name, pending.age) }))
      localStorage.removeItem(PENDING_PROFILE_KEY)
    } catch {}
  }, [email, setState])

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleDailyReset = React.useCallback((newDate: string) => {
    setState((current) => {
      const totalsWithCurrent = syncDailyTotals(current.dailyTotals, current.dateKey, current.intakes.reduce((sum, entry) => sum + entry.amount, 0))
      return {
        ...current,
        dateKey: newDate,
        intakes: [],
        dailyTotals: syncDailyTotals(totalsWithCurrent, newDate, 0),
        goalHistory: upsertGoalHistory(current.goalHistory, newDate, current.goalMl),
      }
    })
  }, [setState, syncDailyTotals, upsertGoalHistory])

  React.useEffect(() => {
    const todayKey = toDateKey()
    if (todayKey !== dateKey) handleDailyReset(todayKey)
  }, [dateKey, handleDailyReset])

  useDailyReset(dateKey, handleDailyReset)

  const addIntake = (amount: number) => setState((current) => ({
    ...current,
    intakes: [{ id: crypto.randomUUID(), amount, timestamp: Date.now() }, ...current.intakes],
    dailyTotals: applyDailyDelta(current.dailyTotals, current.dateKey, amount),
  }))

  const removeIntake = (id: string) => {
    setState((current) => {
      const intake = current.intakes.find((entry) => entry.id === id)
      if (!intake) return current
      return {
        ...current,
        intakes: current.intakes.filter((entry) => entry.id !== id),
        dailyTotals: applyDailyDelta(current.dailyTotals, current.dateKey, -intake.amount),
      }
    })
  }

  const resetTodayIntakes = React.useCallback(() => {
    setState((current) => ({ ...current, intakes: [], dailyTotals: syncDailyTotals(current.dailyTotals, current.dateKey, 0) }))
  }, [setState, syncDailyTotals])

  const onReminderChange = (enabled: boolean, interval: ReminderInterval) => setState((current) => ({ ...current, remindersEnabled: enabled, reminderInterval: interval }))
  const onUnitChange = (unit: VolumeUnit) => setState((current) => ({ ...current, volumeUnit: unit }))
  const onGoalChange = React.useCallback((goal: number) => {
    const normalized = Math.max(250, Math.round(goal))
    const currentDate = toDateKey()
    setState((current) => ({ ...current, goalMl: normalized, goalHistory: upsertGoalHistory(current.goalHistory, currentDate, normalized) }))
  }, [setState, upsertGoalHistory])
  const toggleDark = () => setState((current) => ({ ...current, darkMode: !current.darkMode }))
  const logout = () => {
    db.auth.signOut()
    document.documentElement.classList.remove('dark')
  }

  const [section, setSection] = React.useState<SectionKey>('Dashboard')

  const dailyTotalsMap = React.useMemo(() => {
    const map = new Map<string, number>()
    dailyTotals.forEach((entry) => map.set(entry.dateKey, entry.total))
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
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - offset, 1)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      result.push({ label: date.toLocaleDateString(undefined, { month: 'short' }), value: monthlyMap.get(monthKey) ?? 0 })
    }
    return result
  }, [dailyTotalsMap])

  const dailyData = React.useMemo(() => Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const dateKeyValue = toDateKey(date)
    return { label: date.toLocaleDateString(undefined, { weekday: 'short' }), value: dailyTotalsMap.get(dateKeyValue) ?? 0 }
  }), [dailyTotalsMap])

  const hourlyData = React.useMemo(() => {
    const totals = Array.from({ length: 24 }, () => 0)
    intakes.forEach((intake) => { totals[new Date(intake.timestamp).getHours()] += intake.amount })
    return totals.map((value, index) => ({ label: index.toString().padStart(2, '0'), value }))
  }, [intakes])

  const weeklyTotal = dailyData.reduce((sum, entry) => sum + entry.value, 0)
  const weeklyAverage = Math.round(weeklyTotal / dailyData.length)
  const currentMonthTotal = monthlyData[monthlyData.length - 1]?.value ?? 0
  const activeHours = hourlyData.filter((entry) => entry.value > 0).length
  const consistencyDays = dailyData.filter((entry) => entry.value >= goalMl * 0.8).length
  const streakDays = React.useMemo(() => {
    let streak = 0
    const cursor = new Date()
    while (dailyTotalsMap.get(toDateKey(cursor))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [dailyTotalsMap])

  const goalsLast30 = React.useMemo(() => goalHistory.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 30), [goalHistory])
  const formatGoalDate = React.useCallback((dateKeyValue: string) => new Date(`${dateKeyValue}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), [])
  const todayGoalEntry = goalsLast30.find((entry) => entry.dateKey === dateKey) ?? ({ dateKey, goal: goalMl, timestamp: Date.now() } as PersistedStateV1['goalHistory'][number])
  const recentGoalEntries = goalsLast30.filter((entry) => entry.dateKey !== todayGoalEntry.dateKey).slice(0, 6)
  const streakDisplayCount = 7
  const visibleStreakDays = Math.min(streakDays, streakDisplayCount)

  const [eyebrow, description] = SECTION_META[section]

  return (
    <div className="min-h-screen bg-app text-slate-900 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between gap-3 lg:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">H</div>
                <div>
                  <p className="text-sm font-semibold text-main">Hydra</p>
                  <p className="text-xs text-soft">Water tracker</p>
                </div>
              </div>
              <button className="btn-secondary lg:hidden" onClick={logout}>Log out</button>
            </div>

            <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1" aria-label="Primary">
              {(Object.keys(SECTION_META) as SectionKey[]).map((item) => (
                <button
                  key={item}
                  className={section === item ? 'nav-item nav-item-active' : 'nav-item'}
                  onClick={() => setSection(item)}
                >
                  <span>{item}</span>
                  <span className="text-xs text-soft">{SECTION_META[item][0]}</span>
                </button>
              ))}
            </nav>

            <div className="hidden flex-1 lg:block" />

            <div className="grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-main">{profile.name}</p>
                  <p className="truncate text-xs text-soft">{profile.email || email}</p>
                </div>
                <span className={remindersEnabled ? 'status-dot status-dot-active' : 'status-dot'} aria-label={remindersEnabled ? 'Reminders enabled' : 'Reminders disabled'} />
              </div>
              <div className="segmented" aria-label="Volume unit">
                {VOLUME_UNITS.map((unit) => (
                  <button
                    key={unit}
                    className={volumeUnit === unit ? 'segmented-option segmented-option-active' : 'segmented-option'}
                    onClick={() => onUnitChange(unit)}
                  >
                    {getUnitLabel(unit)}
                  </button>
                ))}
              </div>
              <div className="hidden grid-cols-2 gap-2 lg:grid">
                <button className="btn-secondary justify-center" onClick={toggleDark}>{darkMode ? 'Light' : 'Dark'}</button>
                <button className="btn-secondary justify-center" onClick={logout}>Log out</button>
              </div>
            </div>
          </div>
        </aside>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-main">{section}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
              <MiniStat label="Today" value={formatDisplay(total, true)} />
              <MiniStat label="Goal" value={formatDisplay(goalMl, true)} />
              <MiniStat label="Last log" value={lastLoggedTime} />
            </div>
          </header>

          <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Current intake" value={formatDisplay(total)} caption={remainingMl > 0 ? `${formatDisplay(remainingMl)} remaining today` : `${formatDisplay(surplusMl)} above goal`} />
            <StatCard label="Goal progress" value={`${percentOfGoal.toFixed(0)}%`} caption={`Target ${formatDisplay(goalMl)}`} />
            <StatCard label="Entries today" value={`${intakes.length}`} caption={intakes.length > 0 ? `Average ${formatDisplay(dailyAverage)} per log` : 'No entries recorded yet'} />
            <StatCard label="Streak" value={`${streakDays} day${streakDays === 1 ? '' : 's'}`} caption={remindersEnabled ? `Reminder interval ${reminderInterval} min` : 'Manual tracking only'} />
          </section>

          {section === 'Dashboard' && (
            <div className="space-y-5">
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_420px]">
                <div className="panel">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow">Primary metric</p>
                      <h2 className="mt-2 text-xl font-semibold text-main">Daily intake progress</h2>
                    </div>
                    <div className="metric-badge">{percentOfGoal.toFixed(0)}% complete</div>
                  </div>
                  <div className="min-h-[420px]">
                    <WaterFillCard valueMl={total} goalMl={goalMl} unit={volumeUnit} className="h-full w-full" />
                  </div>
                </div>

                <div className="space-y-5">
                  <section className="panel">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow">Log intake</p>
                        <h2 className="mt-2 text-xl font-semibold text-main">Quick actions</h2>
                      </div>
                      <button className="btn-secondary" onClick={resetTodayIntakes}>Reset</button>
                    </div>
                    <div className="mt-5 space-y-5">
                      <QuickAddButtons unit={volumeUnit} onAdd={addIntake} />
                      <GoalSetter goalMl={goalMl} unit={volumeUnit} onChange={onGoalChange} />
                    </div>
                  </section>

                  <section className="panel">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">Routine</p>
                        <p className="mt-2 text-2xl font-semibold text-main">{streakDays}</p>
                        <p className="text-sm text-muted">day{streakDays === 1 ? '' : 's'} in a row</p>
                      </div>
                      <div className="text-right text-sm text-muted">{remindersEnabled ? `${reminderInterval} min reminders` : 'Reminders off'}</div>
                    </div>
                    <div className="mt-5 grid grid-cols-7 gap-1.5" aria-label={`${streakDays}-day hydration streak`}>
                      {Array.from({ length: streakDisplayCount }).map((_, index) => {
                        const active = index < visibleStreakDays
                        return <span key={`streak-${index}`} className={active ? 'streak-cell streak-cell-active' : 'streak-cell'} />
                      })}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">{motivator}</p>
                  </section>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="panel">
                  <p className="eyebrow">Timeline</p>
                  <h2 className="mt-2 text-xl font-semibold text-main">Today&apos;s intake history</h2>
                  <div className="mt-5 space-y-5">
                    <IntakeHistoryChart intakes={intakes} unit={volumeUnit} />
                    <IntakeHistory intakes={intakes} unit={volumeUnit} onRemove={removeIntake} />
                  </div>
                </div>
                <div className="panel">
                  <p className="eyebrow">Profile</p>
                  <div className="mt-5 space-y-3 text-sm text-muted">
                    <InfoRow label="Name" value={profile.name} />
                    <InfoRow label="Email" value={profile.email || email || 'Not available'} />
                    <InfoRow label="Age" value={profile.age > 0 ? `${profile.age}` : 'Not provided'} />
                    <InfoRow label="Theme" value={darkMode ? 'Dark' : 'Light'} />
                  </div>
                </div>
              </section>
            </div>
          )}

          {section === 'Analytics' && (
            <div className="space-y-5">
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="This week" value={formatDisplay(weeklyTotal)} caption={`Average ${formatDisplay(weeklyAverage)} per day`} />
                <StatCard label="This month" value={formatDisplay(currentMonthTotal)} caption="Rolling six-month view" />
                <StatCard label="Active hours" value={`${activeHours}`} caption="Hours with at least one intake today" />
                <StatCard label="Consistency" value={`${consistencyDays}/7`} caption="Days at 80% of goal or better" />
              </section>
              <section className="panel">
                <RhythmBoard monthlyData={monthlyData} dailyData={dailyData} hourlyData={hourlyData} unit={volumeUnit} darkMode={darkMode} />
              </section>
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="panel">
                  <p className="eyebrow">Daily trend</p>
                  <h2 className="mt-2 text-xl font-semibold text-main">Cumulative intake across the day</h2>
                  <div className="mt-5">
                    <IntakeHistoryChart intakes={intakes} unit={volumeUnit} />
                  </div>
                </div>
                <div className="panel">
                  <p className="eyebrow">Signals</p>
                  <div className="mt-5 space-y-3">
                    <InsightCard title="Goal coverage" body={remainingMl > 0 ? `You are ${formatDisplay(remainingMl)} away from your target today.` : `You are ${formatDisplay(surplusMl)} above your target today.`} />
                    <InsightCard title="Logging rhythm" body={intakes.length > 0 ? `Your average entry is ${formatDisplay(dailyAverage)} across ${intakes.length} logs today.` : 'No intake pattern is available yet because nothing has been logged today.'} />
                    <InsightCard title="Reminder support" body={remindersEnabled ? `Reminders are active every ${reminderInterval} minutes.` : 'Reminders are off, so hydration is currently tracked manually.'} />
                  </div>
                </div>
              </section>
            </div>
          )}

          {section === 'Goals' && (
            <div className="space-y-5">
              <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
                <div className="panel panel-accent">
                  <p className="eyebrow">Current goal</p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-main">{formatDisplay(todayGoalEntry.goal)}</p>
                  <p className="mt-2 text-sm text-muted">Active on {formatGoalDate(todayGoalEntry.dateKey)}</p>
                  <div className="mt-6 space-y-5">
                    <GoalSetter goalMl={goalMl} unit={volumeUnit} onChange={onGoalChange} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MiniStat label="Consumed" value={formatDisplay(total)} />
                      <MiniStat label="Remaining" value={formatDisplay(remainingMl)} />
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <p className="eyebrow">Context</p>
                  <h2 className="mt-2 text-xl font-semibold text-main">Target management</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InsightCard title="Current pace" body={intakes.length > 0 ? `Today you have logged ${intakes.length} entries and reached ${percentOfGoal.toFixed(0)}% of the target.` : 'No water has been logged yet today.'} />
                    <InsightCard title="Goal history" body={`${goalsLast30.length} goal records are retained locally for recent adjustments.`} />
                  </div>
                </div>
              </section>
              <section className="panel">
                <p className="eyebrow">Recent history</p>
                <h2 className="mt-2 text-xl font-semibold text-main">Previous goal entries</h2>
                <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  <GoalHistoryCard entry={todayGoalEntry} highlighted formatGoalDate={formatGoalDate} formatValue={formatDisplay} />
                  {recentGoalEntries.length > 0 ? recentGoalEntries.map((entry) => (
                    <GoalHistoryCard key={`${entry.dateKey}-${entry.timestamp}`} entry={entry} formatGoalDate={formatGoalDate} formatValue={formatDisplay} />
                  )) : (
                    <div className="empty-state">
                      Additional goal history will appear here as you update your target on future dates.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {section === 'Reminders' && (
            <div className="space-y-5">
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="panel">
                  <p className="eyebrow">Reminder settings</p>
                  <h2 className="mt-2 text-xl font-semibold text-main">Notification cadence</h2>
                  <div className="mt-5">
                    <ReminderToggle enabled={remindersEnabled} interval={reminderInterval} onChange={onReminderChange} />
                  </div>
                </div>
                <div className="panel">
                  <p className="eyebrow">Preferences</p>
                  <div className="mt-5 space-y-3">
                    <InsightCard title="Notification behavior" body="Browser notifications are requested only when reminders are enabled." />
                    <InsightCard title="Daily reset" body="Entries belong to the active day and reset automatically when the date changes." />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="btn-secondary justify-center" onClick={toggleDark}>{darkMode ? 'Light mode' : 'Dark mode'}</button>
                      <button className="btn-secondary justify-center" onClick={resetTodayIntakes}>Clear today</button>
                    </div>
                  </div>
                </div>
              </section>
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Reminder status" value={remindersEnabled ? 'Enabled' : 'Disabled'} caption={remindersEnabled ? `Every ${reminderInterval} minutes` : 'No scheduled reminders'} />
                <StatCard label="Theme" value={darkMode ? 'Dark' : 'Light'} caption="Applies immediately across the app" />
                <StatCard label="Reset cadence" value="Daily" caption="Automatic on date change" />
                <StatCard label="Manual reset" value="Available" caption="Clears only today's entries" />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-soft">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-main">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-soft px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-main">{value}</p>
    </div>
  )
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-soft px-4 py-4">
      <p className="text-sm font-semibold text-main">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
      <span className="text-soft">{label}</span>
      <span className="truncate text-right font-medium text-main">{value}</span>
    </div>
  )
}

function GoalHistoryCard({
  entry,
  highlighted = false,
  formatGoalDate,
  formatValue,
}: {
  entry: { goal: number; dateKey: string; timestamp: number }
  highlighted?: boolean
  formatGoalDate: (dateKey: string) => string
  formatValue: (valueMl: number, compact?: boolean) => string
}) {
  return (
    <div className={highlighted ? 'goal-card goal-card-active' : 'goal-card'}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">{highlighted ? 'Active goal' : 'Goal entry'}</p>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-main">{formatValue(entry.goal)}</div>
      <div className="mt-2 text-sm text-muted">{formatGoalDate(entry.dateKey)}</div>
      <div className="mt-2 text-xs text-soft">
        Updated at {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
