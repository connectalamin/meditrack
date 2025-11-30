import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Validate DATABASE_URL
const databaseUrl = env('DATABASE_URL')
if (!databaseUrl || !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    'DATABASE_URL is missing or invalid. It must be a PostgreSQL connection string starting with "postgresql://" or "postgres://". ' +
    'Please set the DATABASE_URL environment variable in your Vercel project settings.'
  )
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: databaseUrl,
  },
})


