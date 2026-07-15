import postgres, { type Sql } from 'postgres'

declare global {
  // Reuse the pool during Next.js development hot reloads.
  var brandvoiceSql: Sql | undefined
}

export function getDb(): Sql {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  if (!global.brandvoiceSql) {
    global.brandvoiceSql = postgres(connectionString, {
      max: Number(process.env.DATABASE_POOL_SIZE || 10),
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 60 * 30,
      prepare: false,
      transform: { undefined: null },
    })
  }

  return global.brandvoiceSql
}

export function isUniqueViolation(error: unknown): error is { code: string; constraint_name?: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
}
