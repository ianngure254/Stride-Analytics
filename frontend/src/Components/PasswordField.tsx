import { useState } from 'react'

type PasswordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete: string
}

const EyeIcon = ({ isVisible }: { isVisible: boolean }) => (
  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
    <path
      d="M2.75 12s3.25-6.25 9.25-6.25S21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    {isVisible ? null : (
      <path d="m4.5 19.5 15-15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    )}
  </svg>
)

const PasswordField = ({ label, value, onChange, placeholder, autoComplete }: PasswordFieldProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-zinc-800">{label}</span>
      <span className="relative block">
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-12 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          type={isVisible ? 'text' : 'password'}
        />
        <button
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-1 grid w-10 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          <EyeIcon isVisible={isVisible} />
        </button>
      </span>
    </label>
  )
}

export default PasswordField
