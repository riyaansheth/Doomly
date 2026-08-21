import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { serverClient } from '@/lib/supabase-server'
import { chunk, generateCards, topicChunks } from '@/lib/generate'
import { transcriptPages } from '@/lib/youtube'

const fail = (msg: string) => NextResponse.json({ error: msg }, { status: 500 })

/**
 * Processes EXACTLY ONE chunk per call and reports progress. The browser drives
 * the loop, so no request gets near a serverless timeout and there is no queue.
 * ponytail: browser-driven work loop. Move to a real queue when generation must
 * continue with the tab closed.
 */
export async function POST(req: Request) {
  const { documentId } = await req.json()
  const db = await serverClient()

  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // RLS scopes this to documents under the caller's own subjects.
  const { data: doc, error } = await db.from('documents').select('*').eq('id', documentId).single()
  if (error || !doc) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const isTopic = doc.source_type === 'topic'

  // Source text is fetched once and cached on the row, whatever it came from.
  let pages: string[] = doc.pages
  if (!pages) {
    try {
      if (doc.source_type === 'youtube') {
        pages = await transcriptPages(doc.source_ref)
      } else if (isTopic) {
        pages = topicChunks(doc.source_ref)
      } else {
        const { data: file, error: dl } = await db.storage.from('docs').download(doc.storage_path)
        if (dl || !file) return fail(`download failed: ${dl?.message}`)
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
        pages = (await extractText(pdf, { mergePages: false })).text
      }
    } catch (e) {
      return fail((e as Error).message)
    }
    if (!pages.length) return fail('Nothing readable in that source.')

    const total = isTopic ? pages.length : chunk(pages).length
    const { error: pErr } = await db.from('documents')
      .update({ pages, chunks_total: total }).eq('id', doc.id)
    if (pErr) return fail(`page save failed: ${pErr.message}`)
  }

  // A typed topic is already one prompt per chunk; everything else gets grouped.
  const chunks = isTopic ? pages : chunk(pages)
  const i = doc.chunks_done
  if (i >= chunks.length) return NextResponse.json({ done: true, total: chunks.length, added: 0 })

  let cards
  try {
    cards = await generateCards(chunks[i], { mode: isTopic ? 'topic' : 'grounded', level: doc.level })
  } catch (e) {
    return fail(`generation failed: ${(e as Error).message}`)
  }

  if (cards.length) {
    const { error: insErr } = await db.from('cards').insert(
      cards.map((c) => ({
        ...c,
        subject_id: doc.subject_id,
        document_id: doc.id,
        // Clamp: a hallucinated page number would break the citation link.
        source_page: isTopic ? 1 : Math.min(Math.max(c.source_page, 1), pages.length),
      })),
    )
    if (insErr) return fail(`card insert failed: ${insErr.message}`)
  }

  // Must succeed, or the browser loop re-runs this same chunk forever.
  const { error: updErr } = await db.from('documents').update({ chunks_done: i + 1 }).eq('id', doc.id)
  if (updErr) return fail(`progress update failed: ${updErr.message}`)

  return NextResponse.json({ done: i + 1 >= chunks.length, total: chunks.length, added: cards.length })
}
