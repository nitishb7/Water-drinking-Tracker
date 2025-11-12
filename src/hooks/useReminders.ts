import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReminderInterval } from '../types'

type Options = {
  shouldRemind: boolean
  interval: ReminderInterval
  title?: string
  body?: string
  sound?: boolean
}

export function useReminders({ shouldRemind, interval, title, body, sound }: Options) {
  const [permission, setPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current && sound) {
      const audio = new Audio(
        'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAAAnEAABFhYWFhYWFhYWFhYWFhYQ=='
      )
      audioRef.current = audio
    }
  }, [sound])

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied' as const
    const res = await Notification.requestPermission()
    setPermission(res)
    return res
  }, [])

  const notify = useCallback(() => {
    const text = body ?? 'Time to drink some water 💧'
    const nTitle = title ?? 'Hydration Reminder'
    if (typeof Notification !== 'undefined' && permission === 'granted') {
      const n = new Notification(nTitle, { body: text, icon: undefined })
      setTimeout(() => n.close(), 5000)
    }
    if (sound && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [permission, title, body, sound])

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!shouldRemind || !interval) return
    // Kick one after the interval, not immediately
    const ms = interval * 60_000
    timerRef.current = window.setInterval(() => {
      notify()
    }, ms)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [shouldRemind, interval, notify])

  return { permission, request }
}

