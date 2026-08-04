import { Request, Response, NextFunction } from 'express';
import * as setupService from './setup.service';

export const setupBusinessContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const result = await setupService.setupBusinessForUser(userId, req.user?.firebaseClaims);

    res.status(200).json({
      message: 'Business context set up successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getBusinessContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const business = {
      id: req.business?.id,
      name: req.business?.name,
      plan: req.business?.plan,
    };

    res.json({
      data: business,
      message: 'Business context retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};
