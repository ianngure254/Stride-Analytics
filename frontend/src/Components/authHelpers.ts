import { FirebaseError } from 'firebase/app'

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const getFirebaseMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'Something went wrong. Please try again.'
  }

  const messages: Record<string, string> = {
    'auth/configuration-not-found': 'Firebase Authentication is not enabled for this project.',
    'auth/email-already-in-use': 'That email is already registered. Please sign in instead.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/network-request-failed': 'Network connection failed. Check your internet and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before completion.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Use a stronger password with at least 6 characters.',
  }

  return messages[error.code] ?? 'Authentication failed. Please check your details and try again.'
}
