import { useEffect } from 'react'
import { toDateKey } from '../utils/date'

export function useDailyReset(currentDateKey: string, onReset: (newDateKey: string) => void) {
  useEffect(() => {
    let raf: number | null = null
    let t: number | null = null
    const check = () => {
      const nowKey = toDateKey()
      if (nowKey !== currentDateKey) {
        onReset(nowKey)
      }
      // schedule next check in ~60s
      t = window.setTimeout(() => {
        raf = requestAnimationFrame(check)
      }, 60_000)
    }
    raf = requestAnimationFrame(check)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (t) clearTimeout(t)
    }
  }, [currentDateKey, onReset])
}

