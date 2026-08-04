import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl || databaseUrl.includes('username') || databaseUrl.includes('password')) {
  throw new Error(
    'DATABASE_URL is missing or still contains placeholder credentials. Update backend/.env with the real PostgreSQL connection string before running Drizzle Studio.'
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
