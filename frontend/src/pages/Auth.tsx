import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FirebaseError } from 'firebase/app'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from './Firebase/config'
import type { PageProps } from './pageData'
import { ActionButton, AppShell, Badge, ErrorNotice, Panel } from './pageShell'

type AuthForm = {
  email: string
  password: string
}

const initialForm: AuthForm = {
  email: '',
  password: '',
}

const getFirebaseMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.'
  }

  const messages: Record<string, string> = {
    'auth/configuration-not-found': 'Firebase Authentication is not enabled for this project.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/network-request-failed': 'Network connection failed. Check your internet and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before completion.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled.',
  }

  return messages[error.code] ?? 'Authentication failed. Please check your details and try again.'
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const Auth = ({ activeRoute, onNavigate }: PageProps) => {
  const [form, setForm] = useState<AuthForm>(initialForm)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setIsLoadingUser(false)
    })

    return unsubscribe
  }, [])

  const displayName = useMemo(() => {
    if (!currentUser) {
      return ''
    }

    return currentUser.displayName || currentUser.email || 'Authenticated user'
  }, [currentUser])

  const submitEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const email = form.email.trim()

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      await signInWithEmailAndPassword(auth, email, form.password)
      setForm(initialForm)
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
    } catch (loginError) {
      setError(getFirebaseMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitLogout = async () => {
    setError('')

    try {
      setIsSubmitting(true)
      await signOut(auth)
    } catch (logoutError) {
      setError(getFirebaseMessage(logoutError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell
      activeRoute={activeRoute}
      onNavigate={onNavigate}
      eyebrow="Firebase Auth"
      title="Secure admin access"
      subtitle="Sign in with Firebase using email/password or a Google account, with clean validation and readable error states."
      actions={<Badge tone={currentUser ? 'green' : 'gold'}>{currentUser ? 'Signed in' : 'Authentication required'}</Badge>}
    >
      <div className="max-w-2xl">
        <Panel title="Sign in" description="Use a Firebase-enabled admin account to access the workspace.">
          <div className="space-y-4">
            {error ? <ErrorNotice message={error} /> : null}

            {isLoadingUser ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm font-medium text-zinc-700" role="status">
                Checking authentication status...
              </div>
            ) : currentUser ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Signed in as</p>
                  <p className="mt-2 text-lg font-black text-emerald-950">{displayName}</p>
                  {currentUser.email ? <p className="mt-1 text-sm text-emerald-800">{currentUser.email}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ActionButton onClick={() => onNavigate('dashboard')}>Go to Dashboard</ActionButton>
                  <ActionButton onClick={submitLogout} variant="secondary">
                    {isSubmitting ? 'Signing out...' : 'Sign Out'}
                  </ActionButton>
                </div>
              </div>
            ) : (
              <>
                <form className="space-y-4" onSubmit={submitEmailLogin}>
                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-zinc-800">Email</span>
                    <input
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      placeholder="admin@stride.co.ke"
                      autoComplete="email"
                      type="email"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-zinc-800">Password</span>
                    <input
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      placeholder="Minimum 6 characters"
                      autoComplete="current-password"
                      type="password"
                    />
                  </label>

                  <ActionButton type="submit">{isSubmitting ? 'Signing in...' : 'Sign In'}</ActionButton>
                </form>

                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs font-bold uppercase text-zinc-500">or</span>
                  <span className="h-px flex-1 bg-zinc-200" />
                </div>

                <ActionButton onClick={submitGoogleLogin} variant="secondary">
                  {isSubmitting ? 'Opening Google...' : 'Continue with Google'}
                </ActionButton>
              </>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

export default Auth
