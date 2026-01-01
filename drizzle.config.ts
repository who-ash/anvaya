import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: [
    './src/server/db/schema/auth-schema.ts',
    './src/server/db/schema/user-schema.ts',
    './src/server/db/schema/organization-schema.ts',
  ],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});