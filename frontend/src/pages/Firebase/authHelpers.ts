import { auth } from './config'

export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser
  if (!user) {
    return null
  }
  return await user.getIdToken()
}

export const getSignedInUserEmail = (): string | null => {
  const user = auth.currentUser
  return user?.email ?? null
}

export const getAuthTokenForDebug = async (): Promise<string | null> => {
  try {
    return await getAuthToken()
  } catch (error) {
    console.error('Failed to get Firebase auth token', error)
    return null
  }
}
