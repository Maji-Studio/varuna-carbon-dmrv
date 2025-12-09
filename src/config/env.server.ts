/**
 * Server-only environment variables
 * These should NEVER be exposed to the client
 */

export const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL!,

  // Isometric API credentials
  // Manage at: https://registry.isometric.com/account/team-settings
  ISOMETRIC_CLIENT_SECRET: process.env.ISOMETRIC_CLIENT_SECRET!,
  ISOMETRIC_ACCESS_TOKEN: process.env.ISOMETRIC_ACCESS_TOKEN!,
  ISOMETRIC_ENVIRONMENT: (process.env.ISOMETRIC_ENVIRONMENT || 'sandbox') as
    | 'sandbox'
    | 'production',

  // Isometric project configuration
  // Get project ID from Certify UI: https://certify.isometric.com
  ISOMETRIC_PROJECT_ID: process.env.ISOMETRIC_PROJECT_ID || '',
  // Get removal template ID from project's removal templates
  ISOMETRIC_REMOVAL_TEMPLATE_ID: process.env.ISOMETRIC_REMOVAL_TEMPLATE_ID || '',
} as const;
