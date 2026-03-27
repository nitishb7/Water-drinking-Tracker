export type Intake = {
  id: string
  amount: number // ml
  timestamp: number // epoch ms
}

export type ReminderInterval = 0 | 30 | 60 | 120
export type VolumeUnit = 'ml' | 'l' | 'fl oz'

export type UserProfile = {
  name: string
  age: number
  email?: string
  provider?: 'google' | 'email' | 'local' | 'clerk'
}

export type PersistedStateV1 = {
  version: 1
  dateKey: string // YYYY-MM-DD for the active day
  goalMl: number
  intakes: Intake[]
  dailyTotals?: {
    dateKey: string
    total: number
  }[]
  goalHistory: {
    dateKey: string
    goal: number
    timestamp: number
  }[]
  remindersEnabled: boolean
  reminderInterval: ReminderInterval
  darkMode: boolean
  volumeUnit?: VolumeUnit
  profile: UserProfile
}
