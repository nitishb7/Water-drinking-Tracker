import { useEffect, useRef, useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T) {
  const readValue = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  }

  const [value, setValue] = useState<T>(readValue)
  const first = useRef(true)
  const prevKey = useRef(key)

  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key
      setValue(readValue())
      first.current = false
      return
    }
    if (first.current) {
      first.current = false
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  return [value, setValue] as const
}
