# Contacts Manager

A single-page app for keeping a personal list of contacts on one device. Its
whole subject matter is the Contact: capturing one, correcting one, finding one
again, and getting rid of one.

## Language

**Contact**:
A person in the list, identified by an id and holding a first name, an email and
a phone number. Emails are unique across the list.
_Avoid_: User, person, entry, record

**Draft**:
A Contact's user-entered fields before it has an id — what the form holds and
what a submit hands over. A Draft may be invalid; a Contact may not.
_Avoid_: Form data, input, payload

**Sample Contact**:
A fixed, illustrative Draft shown whenever the form is starting over with no
Contact to edit, so the form is never visually blank. It is valid and therefore
submittable, but it is not stored until the user submits it. Written in code as
`DEFAULT_DRAFT`.
_Avoid_: Seed, placeholder, dummy contact, test data

**Editing**:
The state in which the form is bound to one existing Contact and a submit
overwrites it. Leaving editing — by cancelling, by submitting, or by deleting
the Contact being edited — always returns the form to the Sample Contact.
_Avoid_: Updating, modifying
