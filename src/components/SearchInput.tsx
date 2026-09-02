import type { RefObject } from 'react'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
}

export function SearchInput({ value, onChange, inputRef }: SearchInputProps) {
  return (
    <div className="search">
      <label className="search-label" htmlFor="contact-search">
        Search contacts
      </label>
      <input
        id="contact-search"
        ref={inputRef}
        type="search"
        className="input"
        placeholder="Search by name, email, or phone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
