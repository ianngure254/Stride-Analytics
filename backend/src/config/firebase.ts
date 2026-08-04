import admin from 'firebase-admin';
import { env, isFirebaseConfigured } from './env';
import { logger } from './logger';
import { AppError } from '../utils/AppError';

if (isFirebaseConfigured && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  logger.info('Firebase Admin initialized');
}

export const firebaseApp = admin.apps.length ? admin.app() : null;
export const firebaseAuth = firebaseApp ? admin.auth() : null;

export const verifyToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
  if (!firebaseAuth) {
    throw new AppError(
      'Firebase authentication is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.',
      503,
      'FIREBASE_NOT_CONFIGURED'
    );
  }

  try {
    return await firebaseAuth.verifyIdToken(token, true);
  } catch (err: any) {
    const message =
      err.code === 'auth/id-token-expired' ? 'Token expired' :
      err.code === 'auth/id-token-revoked' ? 'Token revoked' :
      err.code === 'auth/argument-error' ? 'Invalid token' :
      'Authentication failed';

    throw new AppError(message, 401, err.code);
  }
};

export const getFirebaseUser = async (uid: string) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase authentication is not configured.', 503, 'FIREBASE_NOT_CONFIGURED');
  }

  return firebaseAuth.getUser(uid);
};

export const deleteFirebaseUser = async (uid: string) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase authentication is not configured.', 503, 'FIREBASE_NOT_CONFIGURED');
  }

  return firebaseAuth.deleteUser(uid);
};

export const setCustomClaims = async (uid: string, claims: Record<string, unknown>) => {
  if (!firebaseAuth) {
    throw new AppError('Firebase authentication is not configured.', 503, 'FIREBASE_NOT_CONFIGURED');
  }

  return firebaseAuth.setCustomUserClaims(uid, claims);
};
