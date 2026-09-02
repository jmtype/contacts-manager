import type { Contact, ContactDraft, ValidationErrors } from './types'

export const FIRST_NAME_MAX_LENGTH = 50
export const PHONE_MIN_DIGITS = 7
export const PHONE_MAX_DIGITS = 15

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/
const PHONE_PATTERN = /^\+?[\d\s\-()]+$/

/**
 * Checks a candidate contact's fields against the shape rules and returns one
 * message per offending field. An empty object means the draft is valid.
 * Email uniqueness is deliberately not checked here — see `isEmailTaken`.
 */
export function validateContact(draft: ContactDraft): ValidationErrors {
  const errors: ValidationErrors = {}

  const firstName = draft.firstName.trim()
  if (firstName === '') {
    errors.firstName = 'First name is required'
  } else if (firstName.length > FIRST_NAME_MAX_LENGTH) {
    errors.firstName = `First name must be ${FIRST_NAME_MAX_LENGTH} characters or fewer`
  }

  const email = draft.email.trim()
  if (email === '') {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  const phone = draft.phone.trim()
  const digitCount = phone.replace(/\D/g, '').length
  if (phone === '') {
    errors.phone = 'Phone is required'
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = 'Enter a valid phone number'
  } else if (digitCount < PHONE_MIN_DIGITS || digitCount > PHONE_MAX_DIGITS) {
    errors.phone = `Phone must contain between ${PHONE_MIN_DIGITS} and ${PHONE_MAX_DIGITS} digits`
  }

  return errors
}

/**
 * Whether `email` already belongs to a stored contact. `ignoreId` excludes the
 * contact currently being edited, so re-saving it without changing its address
 * does not collide with itself.
 */
export function isEmailTaken(email: string, contacts: Contact[], ignoreId?: string): boolean {
  const needle = email.trim().toLowerCase()
  return contacts.some((c) => c.id !== ignoreId && c.email.trim().toLowerCase() === needle)
}

/** Case-insensitive ascending sort by email. Returns a new array. */
export function sortContactsByEmail(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) =>
    a.email.toLowerCase().localeCompare(b.email.toLowerCase()),
  )
}

/**
 * Case-insensitive substring match against first name, email, or the raw phone
 * string as typed. An empty or whitespace-only query matches everything.
 */
export function filterContacts(contacts: Contact[], query: string): Contact[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return contacts
  return contacts.filter((c) =>
    [c.firstName, c.email, c.phone].some((field) => field.toLowerCase().includes(needle)),
  )
}
