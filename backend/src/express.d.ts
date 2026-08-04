export type RequestBusinessContext = {
  id: string;
  name?: string;
  plan?: string;
};

export type RequestUserContext = {
  id: string;
  email?: string;
  role?: string;
  firebaseClaims?: Record<string, unknown>;
};

declare module 'express-serve-static-core' {
  interface Request {
    business?: RequestBusinessContext;
    user?: RequestUserContext;
  }
}
