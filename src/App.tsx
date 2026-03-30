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
  Dashboard: ['Overview', 'A cleaner daily workspace for logging water and checking progress.'],
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

  const [eyebrow, description] = SECTION_META[section]

  return (
    <div className="min-h-screen px-4 py-6 text-slate-900 dark:text-slate-100 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="panel overflow-hidden">
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex rounded-full border border-water-200 bg-water-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-water-700 dark:border-water-800 dark:bg-water-500/10 dark:text-water-200">Hydra</div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-main sm:text-4xl">Track your hydration with clarity</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Log water, review progress, and keep a steady routine in one focused workspace.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                    {VOLUME_UNITS.map((unit) => (
                      <button
                        key={unit}
                        className={volumeUnit === unit ? 'nav-pill nav-pill-active px-3 py-1.5' : 'nav-pill px-3 py-1.5'}
                        onClick={() => onUnitChange(unit)}
                      >
                        {getUnitLabel(unit)}
                      </button>
                    ))}
                  </div>
                  <button className="btn-secondary" onClick={toggleDark}>{darkMode ? 'Light mode' : 'Dark mode'}</button>
                  <button className="btn-secondary" onClick={logout}>Log out</button>
                </div>
              </div>
              <nav className="flex flex-wrap gap-2" aria-label="Primary">
                {(Object.keys(SECTION_META) as SectionKey[]).map((item) => (
                  <button key={item} className={section === item ? 'nav-pill nav-pill-active' : 'nav-pill'} onClick={() => setSection(item)}>{item}</button>
                ))}
              </nav>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="surface-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-soft">Account</p>
                <p className="mt-4 text-xl font-semibold text-main">{profile.name}</p>
                <p className="mt-1 text-sm text-soft">{profile.email || email}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900"><p className="text-soft">Goal</p><p className="mt-1 font-semibold text-main">{formatDisplay(goalMl)}</p></div>
                  <div className="rounded-2xl bg-white px-4 py-3 dark:bg-slate-900"><p className="text-soft">Reminders</p><p className="mt-1 font-semibold text-main">{remindersEnabled ? 'On' : 'Off'}</p></div>
                </div>
              </div>
              <div className="rounded-3xl border border-water-100 bg-gradient-to-br from-water-50 to-white p-5 dark:border-water-900/40 dark:from-slate-900 dark:to-slate-800">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-water-700 dark:text-water-200">Today</p>
                <p className="mt-3 text-3xl font-semibold text-main">{formatDisplay(total)}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{remindersEnabled ? `Reminders every ${reminderInterval} minutes.` : 'Reminders are currently off.'} {motivator}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current intake" value={formatDisplay(total)} caption={remainingMl > 0 ? `${formatDisplay(remainingMl)} remaining today` : `${formatDisplay(surplusMl)} above goal`} />
          <StatCard label="Goal progress" value={`${percentOfGoal.toFixed(0)}%`} caption={`Target ${formatDisplay(goalMl)}`} />
          <StatCard label="Entries today" value={`${intakes.length}`} caption={intakes.length > 0 ? `Average ${formatDisplay(dailyAverage)} per log` : 'No entries recorded yet'} />
          <StatCard label="Last update" value={lastLoggedTime} caption={remindersEnabled ? `Reminder interval ${reminderInterval} min` : 'Manual tracking only'} />
        </section>

        <section>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-main sm:text-3xl">{section}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
        </section>

        {section === 'Dashboard' && (
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="panel panel-dark flex flex-col overflow-hidden">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow text-white/65">Primary Metric</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Daily intake progress</h3>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">{percentOfGoal.toFixed(0)}% of goal</div>
                </div>
                <div className="min-h-[360px] flex-1">
                  <WaterFillCard valueMl={total} goalMl={goalMl} unit={volumeUnit} className="h-full w-full" />
                </div>
              </div>
              <div className="space-y-6">
                <section className="panel">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow">Quick Actions</p>
                      <h3 className="mt-2 text-xl font-semibold text-main">Log water and adjust your goal</h3>
                    </div>
                    <button className="btn-secondary" onClick={resetTodayIntakes}>Reset today</button>
                  </div>
                  <div className="mt-6 space-y-5">
                    <GoalSetter goalMl={goalMl} unit={volumeUnit} onChange={onGoalChange} />
                    <QuickAddButtons unit={volumeUnit} onAdd={addIntake} />
                  </div>
                </section>
                <section className="panel">
                  <p className="eyebrow">Daily Summary</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniStat label="Remaining" value={formatDisplay(remainingMl)} />
                    <MiniStat label="Streak" value={`${streakDays} day${streakDays === 1 ? '' : 's'}`} />
                    <MiniStat label="Reminder" value={remindersEnabled ? `${reminderInterval} min` : 'Off'} />
                    <MiniStat label="Average log" value={formatDisplay(dailyAverage || 0)} />
                  </div>
                </section>
              </div>
            </section>
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="panel">
                <p className="eyebrow">Timeline</p>
                <h3 className="mt-2 text-xl font-semibold text-main">Today&apos;s intake history</h3>
                <div className="mt-6 space-y-6">
                  <IntakeHistoryChart intakes={intakes} unit={volumeUnit} />
                  <IntakeHistory intakes={intakes} unit={volumeUnit} onRemove={removeIntake} />
                </div>
              </div>
              <div className="space-y-6">
                <section className="panel">
                  <p className="eyebrow">Focus</p>
                  <h3 className="mt-2 text-xl font-semibold text-main">Keep the workflow simple</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{motivator}</p>
                  <div className="mt-6 rounded-3xl border border-water-100 bg-water-50/70 p-4 text-sm text-water-800 dark:border-water-900/40 dark:bg-water-500/10 dark:text-water-100">Logging close to the moment you drink usually improves consistency more than adding complexity.</div>
                </section>
                <section className="panel">
                  <p className="eyebrow">Profile</p>
                  <div className="mt-4 space-y-3 text-sm text-muted">
                    <InfoRow label="Name" value={profile.name} />
                    <InfoRow label="Email" value={profile.email || email || 'Not available'} />
                    <InfoRow label="Age" value={profile.age > 0 ? `${profile.age}` : 'Not provided'} />
                    <InfoRow label="Theme" value={darkMode ? 'Dark' : 'Light'} />
                  </div>
                </section>
              </div>
            </section>
          </div>
        )}
        {section === 'Analytics' && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="This week" value={formatDisplay(weeklyTotal)} caption={`Average ${formatDisplay(weeklyAverage)} per day`} />
              <StatCard label="This month" value={formatDisplay(currentMonthTotal)} caption="Rolling six-month view" />
              <StatCard label="Active hours" value={`${activeHours}`} caption="Hours with at least one intake today" />
              <StatCard label="Consistency" value={`${consistencyDays}/7`} caption="Days at 80% of goal or better" />
            </section>
            <section className="panel">
              <RhythmBoard monthlyData={monthlyData} dailyData={dailyData} hourlyData={hourlyData} unit={volumeUnit} darkMode={darkMode} />
            </section>
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="panel">
                <p className="eyebrow">Daily Trend</p>
                <h3 className="mt-2 text-xl font-semibold text-main">Cumulative intake across the day</h3>
                <div className="mt-6">
                  <IntakeHistoryChart intakes={intakes} unit={volumeUnit} />
                </div>
              </div>
              <div className="panel">
                <p className="eyebrow">Observed Signals</p>
                <div className="mt-5 space-y-4">
                  <InsightCard title="Goal coverage" body={remainingMl > 0 ? `You are ${formatDisplay(remainingMl)} away from your target today.` : `You are ${formatDisplay(surplusMl)} above your target today.`} />
                  <InsightCard title="Logging rhythm" body={intakes.length > 0 ? `Your average entry is ${formatDisplay(dailyAverage)} across ${intakes.length} logs today.` : 'No intake pattern is available yet because nothing has been logged today.'} />
                  <InsightCard title="Reminder support" body={remindersEnabled ? `Reminders are active every ${reminderInterval} minutes to support a steadier cadence.` : 'Reminders are off, so hydration is currently tracked manually.'} />
                </div>
              </div>
            </section>
          </div>
        )}
        {section === 'Goals' && (
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="panel panel-accent">
                <p className="eyebrow text-water-800 dark:text-water-200">Current Goal</p>
                <p className="mt-4 text-5xl font-semibold tracking-tight text-main">{formatDisplay(todayGoalEntry.goal)}</p>
                <p className="mt-3 text-sm text-muted">Active on {formatGoalDate(todayGoalEntry.dateKey)}</p>
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
                <h3 className="mt-2 text-xl font-semibold text-main">Keep the target realistic and easy to maintain</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InsightCard title="Current pace" body={intakes.length > 0 ? `Today you have logged ${intakes.length} entries and reached ${percentOfGoal.toFixed(0)}% of the target.` : 'No water has been logged yet today, so this is a good time to establish the baseline for the day.'} />
                  <InsightCard title="Goal history" body={`${goalsLast30.length} goal records are retained locally so recent adjustments stay easy to review.`} />
                </div>
              </div>
            </section>
            <section className="panel">
              <p className="eyebrow">Recent History</p>
              <h3 className="mt-2 text-xl font-semibold text-main">Previous goal entries</h3>
              <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <GoalHistoryCard entry={todayGoalEntry} highlighted formatGoalDate={formatGoalDate} formatValue={formatDisplay} />
                {recentGoalEntries.length > 0 ? recentGoalEntries.map((entry) => (
                  <GoalHistoryCard key={`${entry.dateKey}-${entry.timestamp}`} entry={entry} formatGoalDate={formatGoalDate} formatValue={formatDisplay} />
                )) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-sm text-soft dark:border-slate-700 dark:bg-slate-800/80">
                    Additional goal history will appear here as you update your target on future dates.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {section === 'Reminders' && (
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="panel">
                <p className="eyebrow">Reminder Settings</p>
                <h3 className="mt-2 text-xl font-semibold text-main">Keep reminders predictable</h3>
                <div className="mt-6">
                  <ReminderToggle enabled={remindersEnabled} interval={reminderInterval} onChange={onReminderChange} />
                </div>
              </div>
              <div className="panel">
                <p className="eyebrow">Preferences</p>
                <div className="mt-5 space-y-4">
                  <InsightCard title="Notification behavior" body="Browser notifications are requested only when reminders are enabled. Sound reminders can still help while the tab is open." />
                  <InsightCard title="Daily reset" body="Entries belong to the active day. The app resets automatically when the date changes and can also be reset manually." />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button className="btn-secondary justify-center" onClick={toggleDark}>{darkMode ? 'Switch to light mode' : 'Switch to dark mode'}</button>
                    <button className="btn-secondary justify-center" onClick={resetTodayIntakes}>Clear today&apos;s entries</button>
                  </div>
                </div>
              </div>
            </section>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Reminder status" value={remindersEnabled ? 'Enabled' : 'Disabled'} caption={remindersEnabled ? `Every ${reminderInterval} minutes` : 'No scheduled reminders'} />
              <StatCard label="Theme" value={darkMode ? 'Dark' : 'Light'} caption="Applies immediately across the app" />
              <StatCard label="Reset cadence" value="Daily" caption="Automatic on date change" />
              <StatCard label="Manual reset" value="Available" caption="Clears only today&apos;s entries" />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-soft">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-main">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{caption}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-soft px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soft">{label}</p>
      <p className="mt-2 text-lg font-semibold text-main">{value}</p>
    </div>
  )
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-soft px-5 py-4">
      <p className="text-sm font-semibold text-main">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
      <span className="text-soft">{label}</span>
      <span className="text-right font-medium text-main">{value}</span>
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
    <div className={`rounded-3xl border px-6 py-5 ${highlighted ? 'border-water-200 bg-gradient-to-br from-water-50 to-white text-water-900 dark:border-water-900/40 dark:from-slate-900 dark:to-slate-800 dark:text-water-100' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-soft">{highlighted ? 'Active goal' : 'Goal entry'}</p>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{formatValue(entry.goal)}</div>
      <div className={`mt-2 text-sm ${highlighted ? 'text-water-800 dark:text-water-200' : 'text-soft'}`}>{formatGoalDate(entry.dateKey)}</div>
      <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Updated at {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
