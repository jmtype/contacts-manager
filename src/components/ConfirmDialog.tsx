import { Modal } from './Modal'
import type { Contact } from '../lib/types'

type ConfirmDialogProps = {
  contact: Contact
  onConfirm: () => void
  onCancel: () => void
}

/** The delete-specific composition of {@link Modal}. */
export function ConfirmDialog({ contact, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal titleId="confirm-delete-title" onClose={onCancel}>
      <h2 id="confirm-delete-title" className="modal-title">
        Delete contact?
      </h2>
      <p className="modal-body">
        <strong>{contact.firstName}</strong> ({contact.email}) will be permanently removed.
      </p>
      <div className="modal-actions">
        <button type="button" className="button button-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="button button-danger" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </Modal>
  )
}
