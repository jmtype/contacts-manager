import type { Contact } from '../lib/types'

type ContactTableProps = {
  contacts: Contact[]
  editingId: string | null
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}

export function ContactTable({ contacts, editingId, onEdit, onDelete }: ContactTableProps) {
  return (
    <div className="table-scroll">
      <table className="contact-table">
        <caption className="visually-hidden">Contacts, sorted by email</caption>
        <thead>
          <tr>
            <th scope="col">First name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className={contact.id === editingId ? 'row-editing' : undefined}>
              <td>{contact.firstName}</td>
              <td>{contact.email}</td>
              <td>{contact.phone}</td>
              <td className="row-actions">
                <button type="button" className="button button-small" onClick={() => onEdit(contact)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="button button-small button-danger-ghost"
                  onClick={() => onDelete(contact)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
