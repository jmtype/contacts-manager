import type { Contact } from './types'

/** Versioned in its name so a future contact shape has a migration path. */
export const STORAGE_KEY = 'contacts.v1'

function isContact(value: unknown): value is Contact {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.phone === 'string'
  )
}

/**
 * Reads the stored contacts, falling back to an empty list on any access,
 * parse, or shape failure so corrupted storage cannot brick the app.
 */
export function readContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isContact)
  } catch {
    return []
  }
}

/** Writes the contacts, ignoring failures such as a full or blocked store. */
export function writeContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  } catch {
    // Persistence is best-effort; the in-memory list stays authoritative.
  }
}
