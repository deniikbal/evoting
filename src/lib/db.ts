import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

function createDbConnection() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const pool = globalForDb.pool ?? new Pool({ connectionString })
  
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool
  }

  return drizzle(pool, { schema })
}

export const db = createDbConnection()