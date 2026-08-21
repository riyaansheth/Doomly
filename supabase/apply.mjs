// Applies schema.sql to the database in DATABASE_URL. Idempotent enough to rerun:
// it reports which statements already existed rather than dying on the first one.
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Set DATABASE_URL in .env.local (Supabase → Project Settings → Database → Connection string → URI)')
  process.exit(1)
}

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()

// Split on semicolons, but never inside a $$-quoted function body — a naive
// split silently mangles create-function and the change appears to apply.
function statements(text) {
  const out = []
  let buf = '', inBody = false
  for (const line of text.split('\n')) {
    buf += line + '\n'
    if ((line.match(/\$\$/g) || []).length % 2 === 1) inBody = !inBody
    if (!inBody && line.trim().endsWith(';')) { out.push(buf); buf = '' }
  }
  if (buf.trim()) out.push(buf)
  return out
}

let applied = 0, existed = 0
for (const stmt of statements(sql)) {
  if (!stmt.replace(/--.*/g, '').trim()) continue
  try { await client.query(stmt); applied++ }
  catch (e) {
    if (/already exists|duplicate/i.test(e.message)) { existed++; continue }
    console.error('\nFailed on:\n' + stmt.trim().slice(0, 300) + '\n\n' + e.message)
    await client.end()
    process.exit(1)
  }
}
await client.end()
console.log(`schema applied — ${applied} statement(s) run, ${existed} already existed`)
