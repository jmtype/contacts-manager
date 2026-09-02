import { useEffect, useState } from 'react'

/**
 * `useState` that reads its initial value from localStorage once at startup and
 * writes the current value back on every change.
 */
export function useLocalStorage<T>(
  read: () => T,
  write: (value: T) => void,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(read)

  useEffect(() => {
    write(value)
  }, [value, write])

  return [value, setValue]
}
