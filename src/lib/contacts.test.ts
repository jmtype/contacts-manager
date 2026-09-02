import { describe, expect, it } from 'vitest'
import type { Contact, ContactDraft } from './types'
import { filterContacts, isEmailTaken, sortContactsByEmail, validateContact } from './contacts'

const draft = (overrides: Partial<ContactDraft> = {}): ContactDraft => ({
  firstName: 'Alice',
  email: 'alice@example.com',
  phone: '+1 (555) 123-4567',
  ...overrides,
})

const contact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 'id-1',
  ...draft(),
  ...overrides,
})

describe('validateContact', () => {
  it('returns no errors for a fully valid contact', () => {
    expect(validateContact(draft())).toEqual({})
  })

  describe('firstName', () => {
    it('rejects an empty first name', () => {
      expect(validateContact(draft({ firstName: '' })).firstName).toBe('First name is required')
    })

    it('rejects a whitespace-only first name', () => {
      expect(validateContact(draft({ firstName: '   ' })).firstName).toBe('First name is required')
    })

    it('accepts a first name of exactly 50 characters', () => {
      expect(validateContact(draft({ firstName: 'a'.repeat(50) })).firstName).toBeUndefined()
    })

    it('rejects a first name longer than 50 characters', () => {
      expect(validateContact(draft({ firstName: 'a'.repeat(51) })).firstName).toBe(
        'First name must be 50 characters or fewer',
      )
    })

    it('measures length after trimming', () => {
      expect(validateContact(draft({ firstName: `  ${'a'.repeat(50)}  ` })).firstName).toBeUndefined()
    })

    it('accepts a single character first name', () => {
      expect(validateContact(draft({ firstName: 'A' })).firstName).toBeUndefined()
    })
  })

  describe('email', () => {
    it('rejects an empty email', () => {
      expect(validateContact(draft({ email: '' })).email).toBe('Email is required')
    })

    it('rejects a whitespace-only email', () => {
      expect(validateContact(draft({ email: '  ' })).email).toBe('Email is required')
    })

    it.each([
      'alice@example.com',
      'alice.smith@example.co.uk',
      'alice+tag@example.com',
      'a_b-c@sub.example.org',
      'ALICE@EXAMPLE.COM',
    ])('accepts %s', (email) => {
      expect(validateContact(draft({ email })).email).toBeUndefined()
    })

    it.each([
      'alice',
      'alice@',
      '@example.com',
      'alice@example',
      'alice example@x.com',
      'alice@@example.com',
      'alice@example..com',
      'alice@example.c',
    ])('rejects %s', (email) => {
      expect(validateContact(draft({ email })).email).toBe('Enter a valid email address')
    })
  })

  describe('phone', () => {
    it('rejects an empty phone', () => {
      expect(validateContact(draft({ phone: '' })).phone).toBe('Phone is required')
    })

    it.each([
      '+1 (555) 123-4567',
      '5551234',
      '555 123 4567',
      '555-123-4567',
      '(555) 123 4567',
      '+44 20 7946 0958',
      '+123456789012345',
    ])('accepts %s', (phone) => {
      expect(validateContact(draft({ phone })).phone).toBeUndefined()
    })

    it('accepts exactly 7 digits', () => {
      expect(validateContact(draft({ phone: '1234567' })).phone).toBeUndefined()
    })

    it('accepts exactly 15 digits', () => {
      expect(validateContact(draft({ phone: '123456789012345' })).phone).toBeUndefined()
    })

    it('rejects 6 digits', () => {
      expect(validateContact(draft({ phone: '123456' })).phone).toBe(
        'Phone must contain between 7 and 15 digits',
      )
    })

    it('rejects 16 digits', () => {
      expect(validateContact(draft({ phone: '1234567890123456' })).phone).toBe(
        'Phone must contain between 7 and 15 digits',
      )
    })

    it.each(['555.123.4567', '555/123/4567', 'call me', '+1 555 123 4567 ext 8', '1-800-FLOWERS'])(
      'rejects the unsupported format %s',
      (phone) => {
        expect(validateContact(draft({ phone })).phone).toBe('Enter a valid phone number')
      },
    )

    it('rejects a plus sign that is not leading', () => {
      expect(validateContact(draft({ phone: '555+1234567' })).phone).toBe('Enter a valid phone number')
    })
  })

  it('reports every invalid field at once', () => {
    expect(validateContact({ firstName: '', email: 'nope', phone: '' })).toEqual({
      firstName: 'First name is required',
      email: 'Enter a valid email address',
      phone: 'Phone is required',
    })
  })
})

describe('isEmailTaken', () => {
  const existing = [contact({ id: 'a', email: 'alice@example.com' }), contact({ id: 'b', email: 'bob@example.com' })]

  it('detects an email already in the list', () => {
    expect(isEmailTaken('bob@example.com', existing)).toBe(true)
  })

  it('ignores case and surrounding whitespace', () => {
    expect(isEmailTaken('  BOB@Example.COM ', existing)).toBe(true)
  })

  it('returns false for an unused email', () => {
    expect(isEmailTaken('carol@example.com', existing)).toBe(false)
  })

  it('returns false for an empty list', () => {
    expect(isEmailTaken('alice@example.com', [])).toBe(false)
  })

  it('excludes the contact being edited', () => {
    expect(isEmailTaken('bob@example.com', existing, 'b')).toBe(false)
  })

  it('still detects a collision with a different contact while editing', () => {
    expect(isEmailTaken('alice@example.com', existing, 'b')).toBe(true)
  })
})

describe('sortContactsByEmail', () => {
  it('sorts ascending by email', () => {
    const sorted = sortContactsByEmail([
      contact({ id: '1', email: 'carol@example.com' }),
      contact({ id: '2', email: 'alice@example.com' }),
      contact({ id: '3', email: 'bob@example.com' }),
    ])
    expect(sorted.map((c) => c.email)).toEqual([
      'alice@example.com',
      'bob@example.com',
      'carol@example.com',
    ])
  })

  it('ignores letter case', () => {
    const sorted = sortContactsByEmail([
      contact({ id: '1', email: 'bob@example.com' }),
      contact({ id: '2', email: 'Alice@example.com' }),
      contact({ id: '3', email: 'alice@example.com' }),
    ])
    expect(sorted.map((c) => c.email.toLowerCase())).toEqual([
      'alice@example.com',
      'alice@example.com',
      'bob@example.com',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [contact({ id: '1', email: 'z@example.com' }), contact({ id: '2', email: 'a@example.com' })]
    sortContactsByEmail(input)
    expect(input.map((c) => c.id)).toEqual(['1', '2'])
  })

  it('returns an empty array unchanged', () => {
    expect(sortContactsByEmail([])).toEqual([])
  })
})

describe('filterContacts', () => {
  const list = [
    contact({ id: '1', firstName: 'Alice', email: 'alice@example.com', phone: '+1 555 111 2222' }),
    contact({ id: '2', firstName: 'Bob', email: 'bob@other.org', phone: '555-333-4444' }),
    contact({ id: '3', firstName: 'Carol', email: 'carol@example.com', phone: '(555) 555 6666' }),
  ]

  it('returns everything for an empty query', () => {
    expect(filterContacts(list, '')).toEqual(list)
  })

  it('returns everything for a whitespace-only query', () => {
    expect(filterContacts(list, '   ')).toEqual(list)
  })

  it('matches a partial first name case-insensitively', () => {
    expect(filterContacts(list, 'ali').map((c) => c.id)).toEqual(['1'])
  })

  it('matches on email', () => {
    expect(filterContacts(list, 'other.org').map((c) => c.id)).toEqual(['2'])
  })

  it('matches on the raw phone string including punctuation', () => {
    expect(filterContacts(list, '(555) 555').map((c) => c.id)).toEqual(['3'])
  })

  it('matches several contacts at once', () => {
    expect(filterContacts(list, 'example.com').map((c) => c.id)).toEqual(['1', '3'])
  })

  it('ignores the case of the query and the data', () => {
    expect(filterContacts(list, 'CAROL').map((c) => c.id)).toEqual(['3'])
  })

  it('trims the query before matching', () => {
    expect(filterContacts(list, '  bob  ').map((c) => c.id)).toEqual(['2'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterContacts(list, 'zzz')).toEqual([])
  })
})
