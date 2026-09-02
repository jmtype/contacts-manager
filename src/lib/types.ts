export type Contact = {
  id: string
  firstName: string
  email: string
  phone: string
}

/** A contact's user-entered fields, before it has an id. */
export type ContactDraft = Omit<Contact, 'id'>

export type ContactField = keyof ContactDraft

export type ValidationErrors = Partial<Record<ContactField, string>>
