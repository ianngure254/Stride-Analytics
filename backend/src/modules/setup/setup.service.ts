import { setCustomClaims } from '../../config/firebase';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/AppError';

export type SetupResult = {
  userId: string;
  businessId: string;
  businessName: string;
  plan: string;
};

export const setupBusinessForUser = async (
  userId: string,
  firebaseClaims?: Record<string, unknown>
): Promise<SetupResult> => {
  // Check if already set up
  const existingBusinessId = firebaseClaims?.businessId;
  if (existingBusinessId && typeof existingBusinessId === 'string') {
    logger.info('User already has business context', { userId });
    return {
      userId,
      businessId: existingBusinessId,
      businessName: (firebaseClaims?.businessName as string) || 'Your Business',
      plan: (firebaseClaims?.plan as string) || 'starter',
    };
  }

  try {
    // For MVP: use Firebase UID as business ID
    const businessId = userId;
    const businessName = 'My Business';
    const plan = 'starter';

    // Set Firebase custom claims
    await setCustomClaims(userId, {
      businessId,
      businessName,
      plan,
      setupAt: new Date().toISOString(),
    });

    logger.info('Business context set up for user', {
      userId,
      businessId,
    });

    return {
      userId,
      businessId,
      businessName,
      plan,
    };
  } catch (error: any) {
    logger.error('Failed to set up business context', {
      userId,
      error: error.message,
    });

    throw new AppError(
      'Failed to set up business context. Please try again.',
      500,
      'SETUP_FAILED'
    );
  }
};
