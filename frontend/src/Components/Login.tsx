import { useState, type FormEvent } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../pages/Firebase/config'
import { getFirebaseMessage, isValidEmail } from './authHelpers'
import PasswordField from './PasswordField'

type LoginProps = {
  onAuthenticated: () => void
  onSwitchToRegister: () => void
}

const Login = ({ onAuthenticated, onSwitchToRegister }: LoginProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const cleanEmail = email.trim()

    if (!isValidEmail(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      await signInWithEmailAndPassword(auth, cleanEmail, password)
      onAuthenticated()
    } catch (loginError) {
      setError(getFirebaseMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitGoogleLogin = async () => {
    setError('')

    try {
      setIsSubmitting(true)
      await signInWithPopup(auth, googleProvider)
      onAuthenticated()
    } catch (loginError) {
      setError(getFirebaseMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase text-amber-700">Authentication required</p>
        <h1 className="mt-2 text-2xl font-black text-zinc-950">Sign in to Stride Analytics</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Use your registered admin or user account before accessing the workspace.</p>
      </div>

      {error ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900" role="alert">
          {error}
        </div>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={submitLogin}>
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

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Minimum 6 characters"
          autoComplete="current-password"
        />

        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-bold uppercase text-zinc-500">or</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        disabled={isSubmitting}
        onClick={submitGoogleLogin}
        type="button"
      >
        {isSubmitting ? 'Opening Google...' : 'Continue with Google'}
      </button>

      <p className="mt-5 text-center text-sm text-zinc-600">
        New to the workspace?{' '}
        <button className="font-bold text-emerald-700 hover:text-emerald-800" onClick={onSwitchToRegister} type="button">
          Create an account
        </button>
      </p>
    </section>
  )
}

export default Login
