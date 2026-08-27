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

// ---- calendar ----
import { ics, googleCalendarUrl, examStart } from '../lib/calendar.ts'

test('a timetable with no time listed is treated as a morning exam', () => {
  assert.equal(examStart({ name: 'CN', exam_date: '2026-09-17', exam_time: null }).getHours(), 9)
  assert.equal(examStart({ name: 'CN', exam_date: '2026-09-17', exam_time: '14:30:00' }).getHours(), 14)
})

test('google calendar link carries a start and an end, not just a date', () => {
  const url = googleCalendarUrl({ name: 'CN', exam_date: '2026-09-17', exam_time: '09:00' })
  const [from, to] = new URL(url).searchParams.get('dates')!.split('/')
  assert.match(from, /^\d{8}T\d{6}$/)
  assert.ok(to > from, 'exam must end after it starts')
})

test('exam times are floating, so they read 9am in every timezone', () => {
  // A trailing Z would pin it to an instant and shift the exam for anyone
  // whose clock differs from whatever rendered the link.
  const dates = new URL(googleCalendarUrl({ name: 'CN', exam_date: '2026-09-17', exam_time: '09:00' }))
    .searchParams.get('dates')!
  assert.ok(!dates.includes('Z'), 'exam time must not be pinned to UTC')
  assert.ok(dates.startsWith('20260917T090000'), `expected a 9am start, got ${dates}`)
})

test('ics emits one VEVENT per exam and stays balanced', () => {
  const out = ics([
    { name: 'CN', exam_date: '2026-09-17', exam_time: null },
    { name: 'DSA', exam_date: '2026-09-21', exam_time: '14:00' },
  ])
  assert.equal(out.match(/BEGIN:VEVENT/g)!.length, 2)
  assert.equal(out.match(/BEGIN:VEVENT/g)!.length, out.match(/END:VEVENT/g)!.length)
  assert.ok(out.startsWith('BEGIN:VCALENDAR') && out.endsWith('END:VCALENDAR'))
  assert.ok(out.includes('\r\n'), 'ics requires CRLF line endings')
})

// ---- timetable ----
import { matchSubject } from '../lib/timetable.ts'

test('timetable subject names match what the student actually typed', () => {
  const subjects = [{ id: '1', name: 'CN' }, { id: '2', name: 'DSA' }, { id: '3', name: 'Operating Systems' }]
  assert.equal(matchSubject('CN', subjects)?.id, '1')
  assert.equal(matchSubject('Computer Networks', subjects)?.id, '1')   // initialism
  assert.equal(matchSubject('operating systems', subjects)?.id, '3')   // case
  assert.equal(matchSubject('Thermodynamics', subjects), undefined)    // no false positive
})

// ---- brainrot ----
import { retell } from '../lib/brainrot.ts'

const br = { title: 'stack = pile of plates fr', body: 'last one on is first one out, no cap' }

test('brainrot off shows the real text', () => {
  assert.deepEqual(retell(false, 'concept', br, 'A stack', 'LIFO.'), { title: 'A stack', body: 'LIFO.' })
})

test('brainrot on retells both parts', () => {
  assert.deepEqual(retell(true, 'concept', br, 'A stack', 'LIFO.'), { title: br.title, body: br.body })
})

test('a true/false statement is never restated, only its explanation', () => {
  // Restating the statement could flip what the student is judging.
  const out = retell(true, 'true_false', br, 'Every BST is balanced', 'No — insert in order.')
  assert.equal(out.title, 'Every BST is balanced')
  assert.equal(out.body, br.body)
})

test('cards generated before brainrot existed fall back cleanly', () => {
  assert.deepEqual(retell(true, 'concept', null, 'A stack', 'LIFO.'), { title: 'A stack', body: 'LIFO.' })
  assert.deepEqual(retell(true, 'mcq', undefined, 'Which is LIFO?'), { title: 'Which is LIFO?', body: undefined })
})

test('calendar events link to the deployed site, not whatever host built them', () => {
  // A link to localhost inside someone's calendar is dead the moment they leave the laptop.
  const e = { name: 'CN', exam_date: '2026-09-17', exam_time: null }
  assert.ok(!googleCalendarUrl(e).includes('localhost'), 'google link points at localhost')
  assert.ok(!ics([e]).includes('localhost'), 'ics points at localhost')
  assert.match(ics([e]), /DESCRIPTION:.*https?:\/\//)
})

// ---- office formats ----
import { pptxSlides, xlsxSheets, kindOf } from '../lib/office.ts'
import { zipSync, strToU8 } from 'fflate'
import * as XLSX from 'xlsx'

const fakePptx = (slides: string[]) => {
  const files: Record<string, Uint8Array> = { '[Content_Types].xml': strToU8('<Types/>') }
  slides.forEach((text, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] =
      strToU8(`<p:sld><p:cSld><p:spTree><a:t>${text}</a:t></p:spTree></p:cSld></p:sld>`)
  })
  return zipSync(files)
}

test('pptx extraction keeps one page per slide', () => {
  const out = pptxSlides(fakePptx(['Title slide', 'Stacks are LIFO', 'Queues are FIFO']))
  assert.equal(out.length, 3)
  assert.equal(out[1], 'Stacks are LIFO')
})

test('slide 10 sorts after slide 9, not after slide 1', () => {
  // String sort would put slide10 second and silently scramble every citation.
  const out = pptxSlides(fakePptx(Array.from({ length: 11 }, (_, i) => `slide ${i + 1}`)))
  assert.equal(out[9], 'slide 10')
  assert.equal(out[10], 'slide 11')
})

test('pptx decodes XML entities rather than showing them raw', () => {
  const out = pptxSlides(fakePptx(['O(n) &lt; O(n&amp;sup2;)']))
  assert.equal(out[0], 'O(n) < O(n&sup2;)')
})

test('a file with no slides fails loudly', () => {
  assert.throws(() => pptxSlides(zipSync({ 'x.txt': strToU8('hi') })), /No slides/)
})

test('xlsx extraction keeps one page per sheet, named', () => {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Term', 'Meaning'], ['LIFO', 'Last in first out']]), 'Glossary')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Week', 'Topic'], [1, 'Arrays']]), 'Plan')
  const out = xlsxSheets(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })))
  assert.equal(out.length, 2)
  assert.match(out[0], /^Sheet: Glossary/)
  assert.match(out[0], /Last in first out/)
  assert.match(out[1], /^Sheet: Plan/)
})

test('file kind comes from the extension, and unknown types are rejected', () => {
  assert.equal(kindOf('notes.PDF'), 'pdf')
  assert.equal(kindOf('deck.pptx'), 'pptx')
  assert.equal(kindOf('marks.xls'), 'xlsx')
  assert.equal(kindOf('photo.png'), null)
})

test('a slide deck is not silently swallowed by the PDF text threshold', () => {
  // Slides carry a fraction of a PDF page's text. With the PDF minimum, a real
  // 7-slide deck came out as ONE chunk starting at slide 4 — three slides gone,
  // with nothing said about it.
  const slides = [
    'Introduction to Stacks',
    'A stack is a LIFO structure. The last element pushed is the first popped.',
    'push() adds to the top. pop() removes from the top.',
    'Applications: undo history, expression evaluation, call stacks.',
    'Time complexity: push, pop and peek are all O(1).',
    'Common mistake: stack overflow is not integer overflow.',
    'Summary and further reading.',
  ]
  const chunks = chunk(slides, 'pptx')
  assert.ok(chunks.length >= 2, 'a 7-slide deck should not collapse to one chunk')
  assert.match(chunks[0], /\[page 1\]/, 'must start at slide 1, not part-way in')
  for (let i = 1; i <= slides.length; i++)
    assert.ok(chunks.join(' ').includes(`[page ${i}]`), `slide ${i} was dropped`)
})

test('a single worksheet is enough to generate from', () => {
  const one = chunk(['Sheet: Glossary\nLIFO,Last in first out\nFIFO,First in first out'], 'xlsx')
  assert.equal(one.length, 1)
})

test('pdf chunking is unchanged — 3 pages per chunk, dense minimum', () => {
  const pages = Array.from({ length: 7 }, (_, i) => `content of page ${i + 1}. `.repeat(20))
  assert.equal(chunk(pages).length, 3)
  assert.equal(chunk(pages, 'pdf').length, 3)
})
