/**
 * Server-only environment variables
 * These should NEVER be exposed to the client
 */

export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,
  // Add other server secrets here (API keys, etc.)
} as const;
