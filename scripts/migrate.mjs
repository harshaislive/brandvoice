import { readFile } from 'node:fs/promises'
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run database migrations')
}

const migration = await readFile(new URL('../database-setup.sql', import.meta.url), 'utf8')
const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5,
  prepare: false,
})

try {
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(hashtext('brandvoice_schema_migration'))`
    await transaction.unsafe(migration)
  })
  console.log('Database migration completed')
} finally {
  await sql.end()
}
