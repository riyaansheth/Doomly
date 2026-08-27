import { unzipSync, strFromU8 } from 'fflate'
import * as XLSX from 'xlsx'

const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")

/** Every run of visible text in a slide part. Table cells use <a:t> too. */
const textOf = (xml: string) =>
  decode([...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]).join(' '))
    .replace(/\s+/g, ' ').trim()

/**
 * A slide is the natural analogue of a page, so a card from a deck can cite
 * "slide 7" the way a PDF card cites p.37. A .pptx is a zip of XML, so this
 * reads the slides directly rather than flattening the deck.
 */
export function pptxSlides(buf: Uint8Array): string[] {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(buf)
  } catch {
    // fflate says "invalid zip data", which means nothing to a student.
    throw new Error(
      "That file isn't a readable PowerPoint. If it's an older .ppt, open it and " +
      'save it as .pptx, then upload again.',
    )
  }

  const slides = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    // slide10 must sort after slide9, so compare the number, not the string.
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

  if (!slides.length) throw new Error('No slides found in that file.')

  return slides.map((name) => {
    const body = textOf(strFromU8(files[name]))
    // Lecturers put real content in the notes, so read them too — via the
    // slide's own rels, since notesSlide numbering doesn't track slide numbering.
    const rels = files[name.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels']
    let notes = ''
    if (rels) {
      const target = strFromU8(rels).match(/Target="[^"]*?(notesSlides\/notesSlide\d+\.xml)"/)
      const part = target && files[`ppt/${target[1]}`]
      if (part) notes = textOf(strFromU8(part))
    }
    return notes ? `${body}\n\nSpeaker notes: ${notes}` : body
  })
}

/** One "page" per worksheet, each headed by its name so the model has context. */
export function xlsxSheets(buf: Uint8Array): string[] {
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buf, { type: 'array' })
  } catch {
    throw new Error("That file isn't a readable spreadsheet. Try re-saving it as .xlsx.")
  }
  if (!wb.SheetNames.length) throw new Error('No sheets found in that file.')

  return wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false })
    return `Sheet: ${name}\n${csv}`.trim()
  })
}

/**
 * Which parser a file needs. `.ppt` is deliberately absent: the old binary
 * format is not a zip, so it would reach the parser and fail confusingly.
 * SheetJS does read legacy binary `.xls`, so that one stays.
 */
export function kindOf(filename: string): 'pdf' | 'pptx' | 'xlsx' | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'pptx') return 'pptx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  return null
}

/** A specific nudge beats "unsupported file" when the fix is one Save As away. */
export function whyUnsupported(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  if (ext === 'ppt') return 'Older .ppt files need converting — open it and save as .pptx, then upload again.'
  if (ext === 'doc' || ext === 'docx') return "Doomly can't read Word files yet. Export it as a PDF and upload that."
  if (ext === 'key') return 'Keynote files need exporting — use File → Export To → PowerPoint, then upload the .pptx.'
  return `Doomly can read PDFs, PowerPoint and Excel files — not ${ext || 'that'}.`
}
