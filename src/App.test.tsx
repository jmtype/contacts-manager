import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/storage'
import type { Contact } from './lib/types'

const seed = (contacts: Contact[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
}

const alice: Contact = {
  id: 'a',
  firstName: 'Alice',
  email: 'alice@example.com',
  phone: '+1 555 111 2222',
}
const bob: Contact = { id: 'b', firstName: 'Bob', email: 'bob@other.org', phone: '555-333-4444' }

const fillForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: { firstName: string; email: string; phone: string },
) => {
  await user.clear(screen.getByLabelText(/first name/i))
  await user.type(screen.getByLabelText(/first name/i), values.firstName)
  await user.clear(screen.getByLabelText(/email/i))
  await user.type(screen.getByLabelText(/email/i), values.email)
  await user.clear(screen.getByLabelText(/phone/i))
  await user.type(screen.getByLabelText(/phone/i), values.phone)
}

const rowFor = (name: string) => screen.getByRole('row', { name: new RegExp(name, 'i') })

describe('adding a contact', () => {
  it('shows the new contact as a row and clears the form', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillForm(user, {
      firstName: 'Alice',
      email: 'alice@example.com',
      phone: '+1 555 111 2222',
    })
    await user.click(screen.getByRole('button', { name: /add contact/i }))

    const row = rowFor('Alice')
    expect(within(row).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(row).getByText('+1 555 111 2222')).toBeInTheDocument()

    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/phone/i)).toHaveValue('')
  })

  it('confirms the addition with a message', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillForm(user, { firstName: 'Alice', email: 'alice@example.com', phone: '5551112222' })
    await user.click(screen.getByRole('button', { name: /add contact/i }))

    expect(await screen.findByText(/contact added/i)).toBeInTheDocument()
  })

  it('persists the contact to localStorage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillForm(user, { firstName: 'Alice', email: 'alice@example.com', phone: '5551112222' })
    await user.click(screen.getByRole('button', { name: /add contact/i }))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ firstName: 'Alice', email: 'alice@example.com' })
  })
})

describe('startup', () => {
  it('shows a friendly empty message when there is nothing stored', () => {
    render(<App />)
    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })

  it('restores contacts saved in a previous session', () => {
    seed([alice, bob])
    render(<App />)

    expect(rowFor('Alice')).toBeInTheDocument()
    expect(rowFor('Bob')).toBeInTheDocument()
  })

  it('falls back to an empty list when stored data is unparseable', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    render(<App />)

    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })

  it('falls back to an empty list when stored data is not an array of contacts', () => {
    localStorage.setItem(STORAGE_KEY, '{"contacts":"nope"}')
    render(<App />)

    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })
})

describe('the table', () => {
  it('lists contacts sorted by email, ignoring case', () => {
    seed([
      { ...bob, id: '1', firstName: 'Carol', email: 'carol@example.com' },
      { ...bob, id: '2', firstName: 'Alice', email: 'Alice@example.com' },
      { ...bob, id: '3', firstName: 'Bob', email: 'bob@example.com' },
    ])
    render(<App />)

    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(names).toEqual(['Alice', 'Bob', 'Carol'])
  })
})

describe('editing a contact', () => {
  it('populates the form, switches it to edit mode, and updates in place', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /edit/i }))

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Alice')
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com')
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+1 555 111 2222')
    expect(screen.getByRole('button', { name: /update contact/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/phone/i))
    await user.type(screen.getByLabelText(/phone/i), '555 999 8888')
    await user.click(screen.getByRole('button', { name: /update contact/i }))

    expect(within(rowFor('Alice')).getByText('555 999 8888')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2 contacts
    expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument()
  })

  it('marks the row bound to the form and unmarks it when the edit ends', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /edit/i }))

    expect(rowFor('Alice')).toHaveAttribute('aria-current', 'true')
    expect(within(rowFor('Alice')).getByText(/editing/i)).toBeInTheDocument()
    expect(rowFor('Bob')).not.toHaveAttribute('aria-current')

    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(rowFor('Alice')).not.toHaveAttribute('aria-current')
    expect(screen.queryByText(/^editing$/i)).not.toBeInTheDocument()
  })

  it('allows saving an edit that leaves the email unchanged', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Alicia')
    await user.click(screen.getByRole('button', { name: /update contact/i }))

    expect(rowFor('Alicia')).toBeInTheDocument()
    expect(screen.queryByText(/already/i)).not.toBeInTheDocument()
  })

  it('rejects an edit that collides with another contact’s email', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByLabelText(/email/i))
    await user.type(screen.getByLabelText(/email/i), 'bob@other.org')
    await user.click(screen.getByRole('button', { name: /update contact/i }))

    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    expect(within(rowFor('Alice')).getByText('alice@example.com')).toBeInTheDocument()
  })

  it('abandons the edit when Cancel is pressed', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /edit/i }))
    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'Changed')
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(rowFor('Alice')).toBeInTheDocument()
    expect(screen.queryByText('Changed')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument()
  })
})

describe('deleting a contact', () => {
  it('asks for confirmation naming the contact, then removes the row', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /delete/i }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/alice/i)
    expect(dialog).toHaveTextContent('alice@example.com')

    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    expect(screen.queryByRole('row', { name: /alice/i })).not.toBeInTheDocument()
    expect(rowFor('Bob')).toBeInTheDocument()
    expect(await screen.findByText(/contact deleted/i)).toBeInTheDocument()
  })

  it('keeps the contact when the dialog is dismissed with Escape', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /delete/i }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rowFor('Alice')).toBeInTheDocument()
  })

  it('keeps the contact when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /delete/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rowFor('Alice')).toBeInTheDocument()
  })

  it('moves focus into the dialog and restores it on close', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    const deleteButton = within(rowFor('Alice')).getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.keyboard('{Escape}')
    expect(deleteButton).toHaveFocus()
  })

  it('keeps focus in the app when confirming removes the triggering button', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    await user.click(within(rowFor('Alice')).getByRole('button', { name: /delete/i }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    expect(screen.getByRole('searchbox', { name: /search/i })).toHaveFocus()
  })
})

describe('searching', () => {
  it('narrows the visible rows as the user types and restores them when cleared', async () => {
    const user = userEvent.setup()
    seed([alice, bob])
    render(<App />)

    const search = screen.getByRole('searchbox', { name: /search/i })
    await user.type(search, 'ali')

    expect(rowFor('Alice')).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /bob/i })).not.toBeInTheDocument()

    await user.clear(search)
    expect(rowFor('Bob')).toBeInTheDocument()
  })

  it('keeps filtered results sorted by email', async () => {
    const user = userEvent.setup()
    seed([
      { ...alice, id: '1', firstName: 'Zoe', email: 'zoe@example.com' },
      { ...alice, id: '2', firstName: 'Amy', email: 'amy@example.com' },
      { ...alice, id: '3', firstName: 'Bob', email: 'bob@other.org' },
    ])
    render(<App />)

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'example.com')

    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent)
    expect(names).toEqual(['Amy', 'Zoe'])
  })

  it('reports when nothing matches', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'zzzz')
    expect(screen.getByText(/no contacts match/i)).toBeInTheDocument()
  })
})

describe('validation', () => {
  it('shows no errors before the first submit attempt', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/first name/i), 'A')
    await user.clear(screen.getByLabelText(/first name/i))

    expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument()
  })

  it('surfaces inline errors on submit and adds no row', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /add contact/i }))

    expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })

  it('clears an error live once the user starts correcting after a failed submit', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /add contact/i }))
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/first name/i), 'Alice')
    expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument()
    expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
  })

  it('rejects a second contact with an email already stored', async () => {
    const user = userEvent.setup()
    seed([alice])
    render(<App />)

    await fillForm(user, { firstName: 'Impostor', email: 'ALICE@example.com', phone: '5559998888' })
    await user.click(screen.getByRole('button', { name: /add contact/i }))

    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /impostor/i })).not.toBeInTheDocument()
  })
})
