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

/** Narrows already-parsed JSON to contacts, discarding anything malformed. */
export function parseContacts(value: unknown): Contact[] {
  if (!Array.isArray(value)) return []
  return value.filter(isContact)
}
