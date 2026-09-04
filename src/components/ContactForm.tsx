import { useState, type FormEvent, type RefObject } from 'react'
import { DEFAULT_DRAFT, normalizeDraft, validateContact } from '../lib/contacts'
import type { Contact, ContactDraft, ValidationErrors } from '../lib/types'

/**
 * Remounted by `App` (via `key`) whenever the edited contact changes, so the
 * field state is simply initialised from `editing` rather than synced to it.
 */
type ContactFormProps = {
  /** The contact being edited, or null when the form adds a new one. */
  editing: Contact | null
  /** Persists the draft; returns any errors the form alone cannot detect. */
  onSubmit: (draft: ContactDraft) => ValidationErrors
  onCancelEdit: () => void
  /** Lets `App` return focus here once a submit has landed. */
  firstFieldRef?: RefObject<HTMLInputElement | null>
}

const FIELDS = [
  { name: 'firstName', label: 'First name', type: 'text', autoComplete: 'given-name' },
  { name: 'email', label: 'Email', type: 'text', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'text', autoComplete: 'tel' },
] as const

export function ContactForm({ editing, onSubmit, onCancelEdit, firstFieldRef }: ContactFormProps) {
  const [values, setValues] = useState<ContactDraft>(() =>
    editing
      ? { firstName: editing.firstName, email: editing.email, phone: editing.phone }
      : DEFAULT_DRAFT,
  )
  const [submitAttempted, setSubmitAttempted] = useState(false)
  /** Errors raised by the caller (e.g. duplicate email), cleared on edit. */
  const [submitErrors, setSubmitErrors] = useState<ValidationErrors>({})

  const errors: ValidationErrors = submitAttempted
    ? { ...validateContact(values), ...submitErrors }
    : {}

  const handleChange = (field: keyof ContactDraft, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setSubmitErrors(({ [field]: _cleared, ...rest }) => rest)
  }

  /**
   * Selects a field still holding its Sample Contact value, so the first
   * keystroke replaces the sample instead of appending to it. Only while adding:
   * an edited contact's own values are the user's, however much they look alike.
   */
  const handleFocus = (field: keyof ContactDraft, target: HTMLInputElement) => {
    if (editing || values[field] !== DEFAULT_DRAFT[field]) return
    target.select()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitAttempted(true)

    if (Object.keys(validateContact(values)).length > 0) return

    const rejection = onSubmit(normalizeDraft(values))
    if (Object.keys(rejection).length > 0) {
      setSubmitErrors(rejection)
      return
    }

    setValues(DEFAULT_DRAFT)
    setSubmitAttempted(false)
    setSubmitErrors({})
  }

  return (
    <form className="card contact-form" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">{editing ? 'Edit contact' : 'New contact'}</h2>

      <div className="form-grid">
        {FIELDS.map((field) => {
          const error = errors[field.name]
          return (
            <div className="field" key={field.name}>
              <label className="field-label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                ref={field.name === 'firstName' ? firstFieldRef : undefined}
                type={field.type}
                autoComplete={field.autoComplete}
                className={error ? 'input input-invalid' : 'input'}
                value={values[field.name]}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${field.name}-error` : undefined}
                onFocus={(event) => handleFocus(field.name, event.target)}
                onChange={(event) => handleChange(field.name, event.target.value)}
              />
              {error && (
                <p className="field-error" id={`${field.name}-error`}>
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="form-actions">
        <button type="submit" className="button button-primary">
          {editing ? 'Update contact' : 'Add contact'}
        </button>
        {editing && (
          <button type="button" className="button button-ghost" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
