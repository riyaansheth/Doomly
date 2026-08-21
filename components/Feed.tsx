'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Card from './Card'
import { browserClient } from '@/lib/supabase'
import { nextCards, type FeedCard } from '@/lib/feed'

export default function Feed({ initial, sources, subjectIds }:
  { initial: FeedCard[]; sources: Record<string, string>; subjectIds: string[] }) {
  const [cards, setCards] = useState(initial)
  const db = useRef(browserClient()).current
  const loading = useRef(false)

  const log = useCallback((card_id: string, action: string, dwell_ms?: number) => {
    db.auth.getUser().then(({ data }) => {
      if (data.user) db.from('interactions').insert({ card_id, action, dwell_ms, user_id: data.user.id })
    })
  }, [db])

  const topUpRef = useRef<(i: number) => void>(() => {})

  // Dwell time is the strongest free signal we get (§6), so measure it rather
  // than just marking cards seen.
  useEffect(() => {
    const enteredAt = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const id = (e.target as HTMLElement).dataset.id!
        if (e.isIntersecting) {
          enteredAt.set(id, Date.now())
          topUpRef.current(Number((e.target as HTMLElement).dataset.i))
        }
        else if (enteredAt.has(id)) {
          const ms = Date.now() - enteredAt.get(id)!
          enteredAt.delete(id)
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
    if (loading.current || index < cards.length - 10) return
    loading.current = true
    try {
      const more = await nextCards(db, subjectIds)
      const have = new Set(cards.map((c) => c.id))
      setCards((cs) => [...cs, ...more.filter((c) => !have.has(c.id))])
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
              <button onClick={(e) => { log(c.id, 'saved'); e.currentTarget.dataset.on = '1' }}>SAVE</button>
              <button onClick={(e) => { log(c.id, 'confused'); e.currentTarget.dataset.on = '1' }}>LOST ME</button>
              <span className="src">{sources[c.document_id]} — p.{c.source_page}</span>
            </footer>
          </div>
        </section>
      ))}
    </div>
  )
}
