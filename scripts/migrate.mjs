import { readFile } from 'node:fs/promises'
import postgres from 'postgres'
import bcrypt from 'bcrypt'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run database migrations')
}

const migration = await readFile(new URL('../database-setup.sql', import.meta.url), 'utf8')
const canonicalPrompts = JSON.parse(await readFile(new URL('../src/config/brand-prompts.json', import.meta.url), 'utf8'))
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
    await transaction`
      INSERT INTO public.beforest_settings (setting_key, setting_value, updated_by)
      VALUES ('prompts', ${transaction.json(canonicalPrompts)}, 'system')
      ON CONFLICT (setting_key) DO NOTHING
    `
  })

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase()
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12)
    const localPart = email.split('@')[0].replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'admin'
    const [existing] = await sql`SELECT id FROM public.users WHERE email = ${email} LIMIT 1`

    if (existing) {
      await sql`UPDATE public.users SET role = 'admin' WHERE id = ${existing.id}`
    } else {
      await sql`
        INSERT INTO public.users (email, username, display_name, password_hash, role)
        VALUES (${email}, ${localPart}, ${localPart}, ${passwordHash}, 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
      `
    }

    console.log(`Admin account ready for ${email}`)
  }
  console.log('Database migration completed')
} finally {
  await sql.end()
}
