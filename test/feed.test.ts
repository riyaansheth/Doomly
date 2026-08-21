import { test } from 'node:test'
import assert from 'node:assert/strict'
import { interleave, weightedInterleave } from '../lib/feed.ts'
import { chunk } from '../lib/generate.ts'

test('interleave alternates subjects instead of running them in blocks', () => {
  const cards = [
    { subject_id: 'a', n: 1 }, { subject_id: 'a', n: 2 }, { subject_id: 'a', n: 3 },
    { subject_id: 'b', n: 4 }, { subject_id: 'b', n: 5 },
  ]
  assert.deepEqual(interleave(cards).map((c) => c.subject_id), ['a', 'b', 'a', 'b', 'a'])
})

test('interleave keeps every card exactly once', () => {
  const cards = Array.from({ length: 17 }, (_, i) => ({ subject_id: `s${i % 4}`, n: i }))
  const out = interleave(cards)
  assert.equal(out.length, cards.length)
  assert.deepEqual(new Set(out.map((c) => c.n)).size, cards.length)
})

test('chunk keeps page numbers visible so cards can cite a source', () => {
  const pages = Array.from({ length: 7 }, (_, i) => `content of page ${i + 1}. `.repeat(20))
  const chunks = chunk(pages)
  assert.equal(chunks.length, 3)            // 3 pages per chunk
  assert.match(chunks[0], /\[page 1\]/)
  assert.match(chunks[1], /\[page 4\]/)
  assert.match(chunks[2], /\[page 7\]/)
})

test('chunk drops near-empty pages instead of paying to generate from them', () => {
  assert.deepEqual(chunk(['', '  ', '']), [])
})

const pool = (spec: Record<string, number>) =>
  Object.entries(spec).flatMap(([subject_id, n]) =>
    Array.from({ length: n }, (_, i) => ({ subject_id, n: `${subject_id}${i}` })))

const longestRun = (ids: string[]) => {
  let best = 1, run = 1
  for (let i = 1; i < ids.length; i++) {
    run = ids[i] === ids[i - 1] ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

test('weights decide the share of the feed', () => {
  const out = weightedInterleave(pool({ a: 60, b: 20 }), { a: 3, b: 1 })
  const a = out.filter((c) => c.subject_id === 'a').length
  // 3:1 means a should take ~75% of the mixed run.
  const share = a / out.length
  assert.ok(share > 0.7 && share < 0.8, `expected ~0.75 share for a, got ${share}`)
})

test('a heavily weighted subject still does not run in a block', () => {
  const out = weightedInterleave(pool({ a: 60, b: 20 }), { a: 3, b: 1 })
  // The whole point of interleaving: proportional, but never monotonous.
  assert.ok(longestRun(out.map((c) => c.subject_id)) <= 3, 'a subject ran too long unbroken')
})

test('a subject with no weight still gets served, just less often', () => {
  const out = weightedInterleave(pool({ a: 10, b: 10 }), { a: 4 })
  assert.equal(out.filter((c) => c.subject_id === 'b').length, 10)
})

test('weighting never drops or duplicates a card', () => {
  const cards = pool({ a: 17, b: 5, c: 9 })
  const out = weightedInterleave(cards, { a: 2.5, b: 1, c: 3.1 })
  assert.equal(out.length, cards.length)
  assert.equal(new Set(out.map((c) => c.n)).size, cards.length)
})
