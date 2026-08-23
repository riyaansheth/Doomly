'use client'
import { useEffect, useState } from 'react'

// A cookie, not localStorage: the feed is server-rendered, so reading it on the
// server means the right text ships in the first HTML — no flash, no mismatch.
const read = () => document.cookie.includes('brainrot=1')

export default function BrainrotToggle() {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(read()), [])

  const flip = () => {
    const next = !on
    document.cookie = `brainrot=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`
    setOn(next)
  }

  return (
    <button className={'switch' + (on ? ' on' : '')} onClick={flip}
      role="switch" aria-checked={on} aria-label="Brainrot mode">
      <span className="switch-knob" />
    </button>
  )
}
