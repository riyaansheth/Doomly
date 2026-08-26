'use client'
import { useState } from 'react'

/**
 * Dev-only reference for the design system. Every token and core component in
 * one place, so later work builds against a real thing instead of guessing.
 * Not linked from the app; reach it at /design-system.
 */
const INK = ['--ground', '--surface', '--raised', '--ink', '--ink-2', '--ink-3', '--rule', '--fill']
const MARKERS = ['--highlighter', '--marker', '--pen', '--wash']
const RADII = ['--r-sm', '--r-md', '--r-lg', '--r-xl', '--r-pill']

export default function DesignSystem() {
  const [picked, setPicked] = useState<number | null>(null)
  const [on, setOn] = useState(false)

  return (
    <main>
      <header className="bar">
        <h1>Design system</h1>
        <button className="toggle" onClick={() => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.dataset.theme = next
        }}>◐</button>
      </header>

      <section className="group">
        <h2 className="group-name">Surfaces &amp; ink</h2>
        <ul className="subjects">
          {INK.map((t) => (
            <li key={t} className="setting">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{t}</span>
              <span style={{ width: 56, height: 32, borderRadius: 'var(--r-sm)',
                             border: '1px solid var(--rule)', background: `var(${t})` }} />
            </li>
          ))}
        </ul>
      </section>

      <section className="group">
        <h2 className="group-name">The marker set</h2>
        <ul className="subjects">
          {MARKERS.map((t) => (
            <li key={t} className="setting">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>{t}</span>
              <span style={{ width: 56, height: 32, borderRadius: 'var(--r-sm)',
                             border: '1px solid var(--rule)', background: `var(${t})` }} />
            </li>
          ))}
        </ul>
        <p className="tag foot">
          No single brand accent. Highlighter washes under ink, marker strokes a correction,
          pen means interactive and nothing else.
        </p>
      </section>

      <section className="group">
        <h2 className="group-name">Type</h2>
        <div className="card-block stack">
          <h1 style={{ fontSize: 34 }}>Large title, serif</h1>
          <p style={{ fontFamily: 'var(--serif), Georgia, serif', fontSize: 30, lineHeight: 1.24 }}>
            The card question, in Newsreader
          </p>
          <p style={{ fontSize: 17 }}>Body — 17px system UI face</p>
          <p className="prose">Prose, secondary ink</p>
          <p style={{ fontSize: 15 }}>Subhead — 15px</p>
          <p className="tag">Footnote — 13px</p>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>Mono — 14px, code and data</p>
        </div>
      </section>

      <section className="group">
        <h2 className="group-name">Radius</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {RADII.map((r) => (
            <div key={r} style={{ width: 76, height: 60, background: 'var(--surface)',
                                  border: '1px solid var(--rule)', borderRadius: `var(${r})`,
                                  display: 'grid', placeItems: 'center',
                                  fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
              {r.replace('--r-', '')}
            </div>
          ))}
        </div>
      </section>

      <section className="group">
        <h2 className="group-name">Buttons</h2>
        <div className="card-block stack">
          <a className="primary" style={{ width: '100%', marginTop: 0 }}>Primary</a>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="tap">Filled capsule</button>
            <button className="ghost">Ghost</button>
            <button className="danger">Destructive</button>
          </div>
        </div>
      </section>

      <section className="group">
        <h2 className="group-name">Answer options &amp; the sweep</h2>
        <div className="card-block">
          <div className="options">
            {['Queue', 'Stack', 'Linked List'].map((o, i) => (
              <button key={o} disabled={picked !== null}
                className={'opt' + (picked === null ? '' : i === 1 ? ' right' : picked === i ? ' wrong' : ' dim')}
                onClick={() => setPicked(i)}>
                <span className="letter">{'ABC'[i]}</span><span>{o}</span>
              </button>
            ))}
          </div>
          <p className="tag foot">
            {picked === null ? 'Tap one — the correct answer gets the highlighter sweep.'
              : <button className="ghost" onClick={() => setPicked(null)}>Reset</button>}
          </p>
        </div>
      </section>

      <section className="group">
        <h2 className="group-name">Controls</h2>
        <ul className="subjects">
          <li className="setting">
            <span>Switch</span>
            <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on}
              onClick={() => setOn(!on)}><span className="switch-knob" /></button>
          </li>
          <li className="setting"><span>Text input</span><input className="sem" placeholder="Sem 4" /></li>
          <li className="setting">
            <span>Select</span>
            <select><option>Adapt to me</option><option>Follow my syllabus</option></select>
          </li>
        </ul>
      </section>

      <section className="group">
        <h2 className="group-name">Mastery — highlighter strokes</h2>
        <ul className="subjects">
          {[['Graphs', 21], ['Queues', 67], ['Arrays', 92]].map(([t, pct]) => (
            <li key={t as string} className="mastery">
              <div className="mastery-head"><strong>{t}</strong><span className="tag">{pct}%</span></div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }}
                  data-weak={(pct as number) < 40 ? '1' : undefined} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="group">
        <h2 className="group-name">Feedback</h2>
        <p className="progress">Generating… part 3/10, 27 cards so far. You can start scrolling now.</p>
        <p className="err">That video has no captions to read.</p>
        <p className="empty-inline">Nothing to measure yet — scroll a few cards and this fills in.</p>
      </section>
    </main>
  )
}
