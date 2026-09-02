import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  titleId: string
  onClose: () => void
  /**
   * Where to send focus if the element that opened the modal is gone by the
   * time it closes — as happens when confirming a delete removes its own row.
   */
  fallbackFocus?: () => HTMLElement | null
  children: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * A generic dialog primitive: portalled to the document root, dims the page,
 * traps and restores focus, closes on Escape or a backdrop click, and locks
 * background scrolling while open. Rendering it is what opens it.
 */
export function Modal({ titleId, onClose, fallbackFocus, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusable = panel?.querySelectorAll<HTMLElement>(FOCUSABLE)
    ;(focusable?.[0] ?? panel)?.focus()

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const targets = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (targets.length === 0) return
      const first = targets[0]
      const last = targets[targets.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = originalOverflow
      const restoreTo = previouslyFocused?.isConnected ? previouslyFocused : fallbackFocus?.()
      restoreTo?.focus()
    }
  }, [onClose, fallbackFocus])

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
