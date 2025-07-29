export const ENV_CONFIG = {
    local: {
      emailUrl: process.env.NEXT_PUBLIC_LOCAL_EMAIL_URL!,
      workflowUrl: process.env.NEXT_PUBLIC_LOCAL_WORKFLOW_URL!,
      apiKey: process.env.NEXT_PUBLIC_LOCAL_API_KEY!,
    },
    development: {
      emailUrl: process.env.NEXT_PUBLIC_DEVELOPMENT_EMAIL_URL!,
      workflowUrl: process.env.NEXT_PUBLIC_DEVELOPMENT_WORKFLOW_URL!,
      apiKey: process.env.NEXT_PUBLIC_DEVELOPMENT_API_KEY!,
    },
    staging: {
      emailUrl: process.env.NEXT_PUBLIC_STAGING_EMAIL_URL!,
      workflowUrl: process.env.NEXT_PUBLIC_STAGING_WORKFLOW_URL!,
      apiKey: process.env.NEXT_PUBLIC_STAGING_API_KEY!,
    },
    production: {
      emailUrl: process.env.NEXT_PUBLIC_PROD_EMAIL_URL!,
      workflowUrl: process.env.NEXT_PUBLIC_PROD_WORKFLOW_URL!,
      apiKey: process.env.NEXT_PUBLIC_PROD_API_KEY!,
    },
} as const

export type EnvKey = keyof typeof ENV_CONFIG;