type SearchInputProps = {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="search">
      <label className="search-label" htmlFor="contact-search">
        Search contacts
      </label>
      <input
        id="contact-search"
        type="search"
        className="input"
        placeholder="Search by name, email, or phone"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
