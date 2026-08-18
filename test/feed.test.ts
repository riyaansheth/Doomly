import { test } from 'node:test'
import assert from 'node:assert/strict'
import { interleave } from '../lib/feed.ts'
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
