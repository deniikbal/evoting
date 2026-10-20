import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Koneksi basis data.
 *
 * Dulu memakai `drizzle-orm/neon-serverless` + `@neondatabase/serverless`
 * karena basis data berada di Neon (us-east-1). Setiap query menyeberang ke
 * Virginia dengan latensi terukur ~248 ms, dan satu penyimpanan suara
 * melakukan 13 query sehingga terasa ~2 detik per suara.
 *
 * Sekarang basis data berjalan di PostgreSQL lokal (127.0.0.1), jadi latensi
 * per query ~1 ms. Yang berubah hanya driver-nya: `node-postgres` (`pg`)
 * dengan sintaks Drizzle yang sama. Skema, query, dan seluruh pemanggil `db`
 * tidak perlu disesuaikan.
 */
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

function createDbConnection() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const pool =
    globalForDb.pool ??
    new Pool({
      connectionString,
      // Satu proses PM2 melayani kiosk + panel admin. 10 koneksi cukup untuk
      // antrean pemilih, dan PostgreSQL lokal sanggup menanganinya tanpa
      // menghabiskan slot `max_connections` milik aplikasi lain di VPS ini.
      max: 10,
      // Jangan biarkan koneksi menggantung selamanya bila ada kebocoran.
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool
  }

  return drizzle(pool, { schema })
}

export const db = createDbConnection()
