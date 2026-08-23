'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Card from './Card'
import { browserClient } from '@/lib/supabase'
import { nextCards, type FeedCard } from '@/lib/feed'

type Source = { label: string; type: string }

// A page number means nothing for a video or a typed topic.
const cite = (s: Source | undefined, page: number) =>
  !s ? '' : s.type === 'youtube' ? `${s.label} — ${page}:00` : s.type === 'topic' ? s.label : `${s.label} — p.${page}`

export default function Feed({ initial, sources, subjectIds, weights }:
  { initial: FeedCard[]; sources: Record<string, Source>; subjectIds: string[]; weights: Record<string, number> }) {
  const [cards, setCards] = useState(initial)
  const db = useRef(browserClient()).current
  const loading = useRef(false)

  // Must await the insert: supabase-js query builders are lazy thenables, so an
  // un-awaited .insert() is built and never sent. Every interaction was being
  // silently dropped, which starved mastery, the cooldown and the teach-gate.
  const log = useCallback(async (card_id: string, action: string, dwell_ms?: number) => {
    const { data } = await db.auth.getUser()
    if (!data.user) return
    const { error } = await db.from('interactions')
      .insert({ card_id, action, dwell_ms, user_id: data.user.id })
    if (error) console.error('Doomly: interaction not logged —', error.message)
  }, [db])

  const topUpRef = useRef<(i: number) => void>(() => {})
  // Survives effect re-runs. Kept in a ref because appending cards re-attaches
  // the observer, and a local Map would lose every card mid-view.
  const enteredAt = useRef(new Map<string, number>())
  const exhausted = useRef(false)

  // Dwell time is the strongest free signal we get (§6), so measure it rather
  // than just marking cards seen.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const id = (e.target as HTMLElement).dataset.id!
        if (e.isIntersecting) {
          enteredAt.current.set(id, Date.now())
          topUpRef.current(Number((e.target as HTMLElement).dataset.i))
        }
        else if (enteredAt.current.has(id)) {
          const ms = Date.now() - enteredAt.current.get(id)!
          enteredAt.current.delete(id)
          if (ms > 500) log(id, 'seen', ms)
        }
      }),
      { threshold: 0.6 },
    )
    document.querySelectorAll('[data-id]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [cards, log])

  // Top up before the student hits the bottom, so the scroll never ends.
  const topUp = async (index: number) => {
    // Guard on cards *remaining*, not an absolute index: `index < length - 6`
    // is always true for a short list, which fired a fetch on every card.
    if (loading.current || exhausted.current || cards.length - index > 6) return
    loading.current = true
    try {
      const more = await nextCards(db, subjectIds, weights)
      const have = new Set(cards.map((c) => c.id))
      const fresh = more.filter((c) => !have.has(c.id))
      // Nothing new means the pool is dry; stop asking on every scroll.
      if (!fresh.length) { exhausted.current = true; return }
      setCards((cs) => [...cs, ...fresh])
    } finally { loading.current = false }
  }

  topUpRef.current = topUp

  if (!cards.length) return <p className="empty">No cards yet. Upload a PDF and give it a minute.</p>

  return (
    <div className="feed">
      {cards.map((c, i) => (
        <section key={c.id} data-id={c.id} data-i={i} className="card">
          <div className="sheet">
            <div className="sheet-body">
              <Card card={c} onAnswer={(correct) => correct !== null && log(c.id, correct ? 'correct' : 'wrong')} />
            </div>
            <footer>
              <button onClick={(e) => { log(c.id, 'saved'); e.currentTarget.dataset.on = '1' }}>Save</button>
              <button onClick={(e) => { log(c.id, 'confused'); e.currentTarget.dataset.on = '1' }}>Lost me</button>
              <span className="src">{cite(sources[c.document_id], c.source_page)}</span>
            </footer>
          </div>
        </section>
      ))}
    </div>
  )
}
