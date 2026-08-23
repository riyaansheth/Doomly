'use client'
import { useState } from 'react'
import type { FeedCard } from '@/lib/feed'
import { retell } from '@/lib/brainrot'

type P = Record<string, any>

// Difficulty, expressed in the only unit a student reads it in.
const MARKS = [1, 2, 5, 8, 10]

export default function Card(
  { card, onAnswer, brainrot = false }:
  { card: FeedCard; onAnswer: (correct: boolean | null) => void; brainrot?: boolean },
) {
  const [picked, setPicked] = useState<number | null>(null)
  const [shown, setShown] = useState(false)
  const p = card.payload as P

  const pick = (i: number, correct: boolean) => {
    if (picked !== null) return
    setPicked(i)
    onAnswer(correct)
  }
  const reveal = () => {
    if (shown) return
    setShown(true)
    onAnswer(null)
  }
  const cls = (i: number, correct: boolean) =>
    'opt' + (picked === null ? '' : correct ? ' right' : picked === i ? ' wrong' : ' dim')

  // Only prose is retold. Options, code and answers stay exactly as generated.
  const said = (title: string, body?: string) => retell(brainrot, card.type, card.brainrot, title, body)

  const head = (kicker: string, title: string) => (
    <>
      <span className="kicker">{kicker}</span>
      <span className="marks">{MARKS[card.difficulty - 1]} MARKS</span>
      <h2>{title}</h2>
    </>
  )

  switch (card.type) {
    case 'concept': {
      const t = said(p.title, p.body)
      return <>{head(card.topic.toUpperCase(), t.title)}<p className="prose">{t.body}</p></>
    }

    case 'mcq':
      return (
        <>
          {head('QUICK CHECK', said(p.question).title)}
          <div className="options">
            {(p.options as string[]).map((o, i) => (
              <button key={i} disabled={picked !== null} className={cls(i, i === p.answerIndex)}
                onClick={() => pick(i, i === p.answerIndex)}>
                <span className="letter">{'ABCDEFGH'[i]}</span><span>{o}</span>
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{said(p.question, p.why).body}</p>}
        </>
      )

    case 'code_bite':
      return (
        <>
          {head('CODE BITE', said(p.question).title)}
          <pre className="code">{p.code}</pre>
          {shown ? <p className="why">{said(p.question, p.answer).body}</p> : <button className="tap" onClick={reveal}>Reveal</button>}
        </>
      )

    case 'exam_trap':
      return (
        <>
          {head('EXAM TRAP', said(p.claim).title)}
          {shown ? <p className="why">{said(p.claim, p.reality).body}</p> : <button className="tap" onClick={reveal}>Where&apos;s the catch?</button>}
        </>
      )

    case 'true_false':
      return (
        <>
          {head('TRUE OR FALSE', said(p.statement).title)}
          <div className="options row">
            {[true, false].map((v, i) => (
              <button key={i} disabled={picked !== null} className={cls(i, v === p.isTrue)}
                onClick={() => pick(i, v === p.isTrue)}>
                {v ? 'True' : 'False'}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{said(p.statement, p.why).body}</p>}
        </>
      )

    default:
      return null
  }
}
