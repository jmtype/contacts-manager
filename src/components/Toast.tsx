import { useEffect } from 'react'

export const TOAST_DURATION_MS = 2500

type ToastProps = {
  message: string
  onDismiss: () => void
}

/** A self-dismissing confirmation message. */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
