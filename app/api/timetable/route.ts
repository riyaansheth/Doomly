import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { serverClient } from '@/lib/supabase-server'
import { readTimetable, matchSubject } from '@/lib/timetable'

/**
 * A timetable is one small table, not a syllabus — it needs no chunk loop.
 * Extract every exam, set the date on subjects that already exist, and create
 * the ones that don't so the student doesn't have to type them twice.
 */
export async function POST(req: Request) {
  const { storagePath } = await req.json()
  const db = await serverClient()

  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: file, error: dl } = await db.storage.from('docs').download(storagePath)
  if (dl || !file) return NextResponse.json({ error: `download failed: ${dl?.message}` }, { status: 500 })

  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
  const text = (await extractText(pdf, { mergePages: true })).text

  let exams
  try {
    exams = await readTimetable(String(text), new Date().getFullYear())
  } catch (e) {
    return NextResponse.json({ error: `couldn't read that timetable: ${(e as Error).message}` }, { status: 500 })
  }
  if (!exams.length) return NextResponse.json({ error: 'No exams found in that file.' }, { status: 422 })

  const { data: subjects } = await db.from('subjects').select('id,name')
  const matched: string[] = []
  const created: string[] = []

  for (const e of exams) {
    const hit = matchSubject(e.subject, subjects ?? [])
    if (hit) {
      await db.from('subjects').update({ exam_date: e.date, exam_time: e.time }).eq('id', hit.id)
      matched.push(hit.name)
    } else {
      await db.from('subjects')
        .insert({ name: e.subject, user_id: user.id, exam_date: e.date, exam_time: e.time })
      created.push(e.subject)
    }
  }

  return NextResponse.json({ found: exams.length, matched, created })
}
