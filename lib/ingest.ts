import type { SupabaseClient } from '@supabase/supabase-js'
import { isYouTube } from './youtube'
import { kindOf } from './office'

export const LEVELS = [
  { value: 1, label: 'New to this' },
  { value: 3, label: 'Know the basics' },
  { value: 5, label: 'Revising for an exam' },
]

type NewDoc = { filename: string; source_type: string; source_ref?: string; storage_path?: string; level: number }
type Say = (msg: string) => void

/**
 * The "background buffer": one chunk per request, looped here in the browser.
 * No queue, and no request long enough to hit a serverless timeout.
 */
export async function ingest(db: SupabaseClient, subjectId: string, doc: NewDoc, say: Say) {
  const { data: row, error } = await db.from('documents')
    .insert({ ...doc, subject_id: subjectId }).select('id').single()
  if (error || !row) return say(error?.message ?? 'could not start')

  say('Reading it…')
  let cards = 0
  for (let done = false, n = 0; !done; n++) {
    let res
    try {
      const r = await fetch('/api/process', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: row.id }),
      })
      res = await r.json()
    } catch (e) {
      return say(`Request failed: ${(e as Error).message}`)
    }
    if (res.error) return say(res.error)
    // The server only reports done once chunks_done passes the total, so a
    // stuck counter would otherwise loop here forever.
    if (n > res.total + 2) return say('Stopped: generation is not advancing.')
    cards += res.added
    done = res.done
    // Scrollable from the first chunk on — no need to wait for the whole source.
    say(done
      ? `Done — ${cards} cards. Go scroll.`
      : `Generating… part ${n + 1}/${res.total}, ${cards} cards so far. You can start scrolling now.`)
  }
}

const upload = async (db: SupabaseClient, userId: string, file: File, ext: string) => {
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await db.storage.from('docs').upload(path, file)
  return { path, error }
}

/** PDFs, slide decks and spreadsheets all take the same route in. */
export async function uploadFile(
  db: SupabaseClient, userId: string, subjectId: string, file: File, level: number, say: Say,
) {
  const kind = kindOf(file.name)
  if (!kind) return say(`Doomly can read PDFs, PowerPoint and Excel files — not ${file.name.split('.').pop()}.`)

  const { path, error } = await upload(db, userId, file, kind)
  if (error) return say(error.message)
  return ingest(db, subjectId, { filename: file.name, source_type: kind, storage_path: path, level }, say)
}

/** One box for both: a link is a link, anything else is a topic to teach. */
export const addSource = (db: SupabaseClient, subjectId: string, text: string, level: number, say: Say) =>
  isYouTube(text)
    ? ingest(db, subjectId, { filename: 'YouTube video', source_type: 'youtube', source_ref: text, level }, say)
    : ingest(db, subjectId, { filename: text, source_type: 'topic', source_ref: text, level }, say)

/** A timetable is one small table, so it skips the chunk loop entirely. */
export async function uploadTimetable(db: SupabaseClient, userId: string, file: File, say: Say) {
  const { path, error } = await upload(db, userId, file, 'pdf')
  if (error) return say(error.message)

  say('Reading your timetable…')
  const res = await fetch('/api/timetable', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storagePath: path }),
  }).then((r) => r.json())
  if (res.error) return say(res.error)

  const bits = [`Found ${res.found} exam${res.found === 1 ? '' : 's'}`]
  if (res.matched.length) bits.push(`dated ${res.matched.join(', ')}`)
  if (res.created.length) bits.push(`added ${res.created.join(', ')}`)
  say(bits.join(' · '))
}
