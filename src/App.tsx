import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ContactForm } from './components/ContactForm'
import { ContactTable } from './components/ContactTable'
import { SearchInput } from './components/SearchInput'
import { Toast } from './components/Toast'
import { useLocalStorage } from './hooks/useLocalStorage'
import { filterContacts, isEmailTaken, sortContactsByEmail } from './lib/contacts'
import { parseContacts, STORAGE_KEY } from './lib/storage'
import type { Contact, ContactDraft, ValidationErrors } from './lib/types'

type ToastMessage = { id: number; text: string }

let nextToastId = 0

export default function App() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(STORAGE_KEY, parseContacts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<Contact | null>(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  /** Where focus lands when confirming a delete unmounts the button that opened the dialog. */
  const searchRef = useRef<HTMLInputElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  /**
   * Bumped whenever the form is done with, so focus returns to its first field
   * ready for the next contact. A counter rather than a boolean because leaving
   * edit mode remounts the form, and focus has to wait for the new node.
   */
  const [formFocusRequest, setFormFocusRequest] = useState(0)

  useEffect(() => {
    if (formFocusRequest === 0) return
    firstFieldRef.current?.focus()
  }, [formFocusRequest])

  const returnFocusToForm = () => setFormFocusRequest((count) => count + 1)

  const editing = contacts.find((contact) => contact.id === editingId) ?? null

  const visibleContacts = useMemo(
    () => filterContacts(sortContactsByEmail(contacts), query),
    [contacts, query],
  )

  const announce = (text: string) => setToast({ id: (nextToastId += 1), text })
  const dismissToast = useCallback(() => setToast(null), [])

  const handleSubmit = (draft: ContactDraft): ValidationErrors => {
    if (isEmailTaken(draft.email, contacts, editingId ?? undefined)) {
      return { email: 'A contact with this email already exists' }
    }

    if (editingId) {
      setContacts((current) =>
        current.map((contact) => (contact.id === editingId ? { ...contact, ...draft } : contact)),
      )
      setEditingId(null)
      announce('Contact updated')
    } else {
      setContacts((current) => [...current, { id: crypto.randomUUID(), ...draft }])
      announce('Contact added')
    }
    returnFocusToForm()
    return {}
  }

  const confirmDeletion = () => {
    if (!pendingDeletion) return
    setContacts((current) => current.filter((contact) => contact.id !== pendingDeletion.id))
    if (editingId === pendingDeletion.id) setEditingId(null)
    setPendingDeletion(null)
    announce('Contact deleted')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Contacts</h1>
        <p className="app-subtitle">Your contacts, stored on this device only.</p>
      </header>

      <ContactForm
        key={editingId ?? 'new'}
        editing={editing}
        firstFieldRef={firstFieldRef}
        onSubmit={handleSubmit}
        onCancelEdit={() => {
          setEditingId(null)
          returnFocusToForm()
        }}
      />

      <section className="card">
        <SearchInput value={query} onChange={setQuery} inputRef={searchRef} />

        {contacts.length === 0 ? (
          <p className="empty-state">No contacts yet. Add your first one using the form above.</p>
        ) : visibleContacts.length === 0 ? (
          <p className="empty-state">No contacts match “{query}”.</p>
        ) : (
          <ContactTable
            contacts={visibleContacts}
            editingId={editingId}
            onEdit={(contact) => setEditingId(contact.id)}
            onDelete={setPendingDeletion}
          />
        )}
      </section>

      {pendingDeletion && (
        <ConfirmDialog
          contact={pendingDeletion}
          onConfirm={confirmDeletion}
          onCancel={() => setPendingDeletion(null)}
          fallbackFocus={() => searchRef.current}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.text} onDismiss={dismissToast} />}
    </div>
  )
}
