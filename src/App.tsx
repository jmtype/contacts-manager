import { useCallback, useMemo, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ContactForm } from './components/ContactForm'
import { ContactTable } from './components/ContactTable'
import { SearchInput } from './components/SearchInput'
import { Toast } from './components/Toast'
import { useLocalStorage } from './hooks/useLocalStorage'
import { filterContacts, isEmailTaken, sortContactsByEmail } from './lib/contacts'
import { readContacts, writeContacts } from './lib/storage'
import type { Contact, ContactDraft, ValidationErrors } from './lib/types'

type ToastMessage = { id: number; text: string }

export default function App() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>(readContacts, writeContacts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<Contact | null>(null)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const editing = contacts.find((contact) => contact.id === editingId) ?? null

  const visible = useMemo(
    () => filterContacts(sortContactsByEmail(contacts), query),
    [contacts, query],
  )

  const announce = (text: string) => setToast({ id: Date.now(), text })
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
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingId(null)}
      />

      <section className="card">
        <SearchInput value={query} onChange={setQuery} />

        {contacts.length === 0 ? (
          <p className="empty-state">No contacts yet — add your first one using the form above.</p>
        ) : visible.length === 0 ? (
          <p className="empty-state">No contacts match “{query}”.</p>
        ) : (
          <ContactTable
            contacts={visible}
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
        />
      )}

      {toast && <Toast key={toast.id} message={toast.text} onDismiss={dismissToast} />}
    </div>
  )
}
