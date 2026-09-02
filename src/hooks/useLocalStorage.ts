import { useEffect, useState } from 'react'

/**
 * `useState` backed by a localStorage key: read once at startup, written back on
 * every change. `parse` narrows whatever was stored, and is also the fallback —
 * it receives `undefined` when the key is absent, unreadable, or not JSON, so a
 * corrupted store cannot brick the app.
 */
export function useLocalStorage<T>(
  key: string,
  parse: (stored: unknown) => T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return parse(raw === null ? undefined : JSON.parse(raw))
    } catch {
      return parse(undefined)
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Persistence is best-effort; the in-memory value stays authoritative.
    }
  }, [key, value])

  return [value, setValue]
}
