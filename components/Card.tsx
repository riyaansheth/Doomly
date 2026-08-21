'use client'
import { useState } from 'react'
import type { FeedCard } from '@/lib/feed'

type P = Record<string, any>

// Difficulty, expressed in the only unit a student reads it in.
const MARKS = [1, 2, 5, 8, 10]

export default function Card({ card, onAnswer }: { card: FeedCard; onAnswer: (correct: boolean | null) => void }) {
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

  const head = (kicker: string, title: string) => (
    <>
      <span className="kicker">{kicker}</span>
      <span className="marks">{MARKS[card.difficulty - 1]} MARKS</span>
      <h2>{title}</h2>
    </>
  )

  switch (card.type) {
    case 'concept':
      return <>{head(card.topic.toUpperCase(), p.title)}<p className="prose">{p.body}</p></>

    case 'mcq':
      return (
        <>
          {head('QUICK CHECK', p.question)}
          <div className="options">
            {(p.options as string[]).map((o, i) => (
              <button key={i} disabled={picked !== null} className={cls(i, i === p.answerIndex)}
                onClick={() => pick(i, i === p.answerIndex)}>
                <span className="letter">{'ABCDEFGH'[i]}</span><span>{o}</span>
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{p.why}</p>}
        </>
      )

    case 'code_bite':
      return (
        <>
          {head('CODE BITE', p.question)}
          <pre className="code">{p.code}</pre>
          {shown ? <p className="why">{p.answer}</p> : <button className="tap" onClick={reveal}>REVEAL</button>}
        </>
      )

    case 'exam_trap':
      return (
        <>
          {head('EXAM TRAP', p.claim)}
          {shown ? <p className="why">{p.reality}</p> : <button className="tap" onClick={reveal}>WHERE&apos;S THE CATCH?</button>}
        </>
      )

    case 'true_false':
      return (
        <>
          {head('TRUE OR FALSE', p.statement)}
          <div className="options row">
            {[true, false].map((v, i) => (
              <button key={i} disabled={picked !== null} className={cls(i, v === p.isTrue)}
                onClick={() => pick(i, v === p.isTrue)}>
                {v ? 'TRUE' : 'FALSE'}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{p.why}</p>}
        </>
      )

    default:
      return null
  }
}
