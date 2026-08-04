import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const requiredEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingEnv.length > 0) {
  throw new Error(`Missing Firebase environment values: ${missingEnv.join(', ')}`)
}

const app = getApps().length > 0 ? getApp() : initializeApp(requiredEnv)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

if (typeof window !== 'undefined') {
  ;(window as any).auth = auth
  ;(window as any).getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser
    return user ? await user.getIdToken() : null
  }
}

export default app
