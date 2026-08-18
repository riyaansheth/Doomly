'use client'
import { useState } from 'react'
import type { FeedCard } from '@/lib/feed'

type P = Record<string, any>

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

  switch (card.type) {
    case 'concept':
      return <Body kicker="CONCEPT" title={p.title}><p className="prose">{p.body}</p></Body>

    case 'mcq':
      return (
        <Body kicker="QUICK CHECK" title={p.question}>
          <div className="options">
            {(p.options as string[]).map((o, i) => (
              <button key={i} onClick={() => pick(i, i === p.answerIndex)}
                className={'opt' + (picked === null ? '' : i === p.answerIndex ? ' right' : picked === i ? ' wrong' : ' dim')}>
                <span className="letter">{'ABCD'[i]}</span>{o}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{p.why}</p>}
        </Body>
      )

    case 'code_bite':
      return (
        <Body kicker="CODE BITE" title={p.question}>
          <pre className="code">{p.code}</pre>
          {shown ? <p className="why">{p.answer}</p> : <button className="tap" onClick={reveal}>Tap to reveal</button>}
        </Body>
      )

    case 'exam_trap':
      return (
        <Body kicker="EXAM TRAP" title={p.claim}>
          {shown ? <p className="why">{p.reality}</p> : <button className="tap" onClick={reveal}>What&apos;s the catch?</button>}
        </Body>
      )

    case 'true_false':
      return (
        <Body kicker="TRUE OR FALSE" title={p.statement}>
          <div className="options row">
            {[true, false].map((v, i) => (
              <button key={i} onClick={() => pick(i, v === p.isTrue)}
                className={'opt' + (picked === null ? '' : v === p.isTrue ? ' right' : picked === i ? ' wrong' : ' dim')}>
                {v ? 'True' : 'False'}
              </button>
            ))}
          </div>
          {picked !== null && <p className="why">{p.why}</p>}
        </Body>
      )

    default:
      return null
  }
}

function Body({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {children}
    </>
  )
}
