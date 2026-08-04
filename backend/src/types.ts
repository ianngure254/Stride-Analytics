import type { Request } from 'express';
import type { RequestBusinessContext, RequestUserContext } from './express';

export type AuthenticatedRequest = Request & {
  business: RequestBusinessContext;
  user?: RequestUserContext;
};
