import type { NextFunction, Request, Response } from 'express';
import Joi, { type ObjectSchema } from 'joi';

export const validate = (schema: ObjectSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.validateAsync(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      req.body = validated;
      next();
    } catch (error) {
      if (Joi.isError(error)) {
        res.status(400).json({
          success: false,
          errors: error.details.map((detail) => ({
            path: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
