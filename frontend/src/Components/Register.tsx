import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../pages/Firebase/config'
import { getFirebaseMessage, isValidEmail } from './authHelpers'
import PasswordField from './PasswordField'
import { setupBusiness } from '../api/setup'

type RegisterProps = {
  onAuthenticated: () => void
  onSwitchToLogin: () => void
}

const Register = ({ onAuthenticated, onSwitchToLogin }: RegisterProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim()

    if (cleanName.length < 2) {
      setError('Enter the user name before creating an account.')
      return
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const credentials = await createUserWithEmailAndPassword(auth, cleanEmail, password)
      await updateProfile(credentials.user, { displayName: cleanName })

      // Set up business context after successful registration
      try {
        await setupBusiness({
          businessName: businessName || 'My Business',
          plan: 'free'
        })
      } catch (setupError) {
        console.warn('Business setup failed, but user was created:', setupError)
        // Don't fail registration if setup fails - user can set up later
      }

      onAuthenticated()
    } catch (registerError) {
      setError(getFirebaseMessage(registerError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase text-amber-700">Create access</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-950">Register a workspace user</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Create a Firebase account before entering the dashboard pages.</p>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900" role="alert">
          {error}
        </div>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={submitRegister}>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-zinc-800">Name</span>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-zinc-800">Email</span>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            type="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-bold text-zinc-800">Business Name</span>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Your business name"
            autoComplete="organization"
          />
        </label>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Minimum 6 characters"
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat password"
          autoComplete="new-password"
        />

        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        Already registered?{' '}
        <button className="font-bold text-emerald-700 hover:text-emerald-800" onClick={onSwitchToLogin} type="button">
          Sign in
        </button>
      </p>
    </section>
  )
}

export default Register
