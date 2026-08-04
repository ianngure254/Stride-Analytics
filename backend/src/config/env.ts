const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parsePort(process.env.PORT, 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5176,http://localhost:5175,http://localhost:5174,http://localhost:5173,http://127.0.0.1:5176,http://127.0.0.1:5175,http://127.0.0.1:5174,http://127.0.0.1:5173,https://stride-analytics-custom.onrender.com',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? process.env.OPEN_API_KEY ?? '',
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: parsePort(process.env.OPENAI_MAX_TOKENS, 800),
  AI_PROVIDER: (process.env.AI_PROVIDER as 'openai' | 'gemini') ?? 'openai',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  GEMINI_MAX_TOKENS: parsePort(process.env.GEMINI_MAX_TOKENS, 800),
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ?? '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ?? '',
};

export const isFirebaseConfigured = Boolean(
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_CLIENT_EMAIL
);
