import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { serverClient } from '@/lib/supabase-server'
import { chunk, generateCards } from '@/lib/generate'

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

  let pages: string[] = doc.pages
  if (!pages) {
    const { data: file, error: dl } = await db.storage.from('docs').download(doc.storage_path)
    if (dl || !file) return NextResponse.json({ error: `download failed: ${dl?.message}` }, { status: 500 })
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
    pages = (await extractText(pdf, { mergePages: false })).text
    const { error: pErr } = await db.from('documents')
      .update({ pages, chunks_total: chunk(pages).length })
      .eq('id', doc.id)
    if (pErr) return NextResponse.json({ error: `page save failed: ${pErr.message}` }, { status: 500 })
  }

  const chunks = chunk(pages)
  const i = doc.chunks_done
  if (i >= chunks.length) return NextResponse.json({ done: true, total: chunks.length, added: 0 })

  let cards
  try {
    cards = await generateCards(chunks[i])
  } catch (e) {
    return NextResponse.json({ error: `generation failed: ${(e as Error).message}` }, { status: 500 })
  }

  if (cards.length) {
    const { error: insErr } = await db.from('cards').insert(
      cards.map((c) => ({
        ...c,
        subject_id: doc.subject_id,
        document_id: doc.id,
        // Clamp: a hallucinated page number would break the citation link.
        source_page: Math.min(Math.max(c.source_page, 1), pages.length),
      })),
    )
    if (insErr) return NextResponse.json({ error: `card insert failed: ${insErr.message}` }, { status: 500 })
  }

  // Must succeed, or the browser loop re-runs this same chunk forever.
  const { error: updErr } = await db.from('documents').update({ chunks_done: i + 1 }).eq('id', doc.id)
  if (updErr) return NextResponse.json({ error: `progress update failed: ${updErr.message}` }, { status: 500 })

  return NextResponse.json({ done: i + 1 >= chunks.length, total: chunks.length, added: cards.length })
}
