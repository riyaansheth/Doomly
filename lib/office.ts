import { unzipSync, strFromU8 } from 'fflate'
import * as XLSX from 'xlsx'

/**
 * A slide is the natural analogue of a page, so a card generated from a deck can
 * cite "slide 7" the same way a PDF card cites p.37. A .pptx is a zip of XML, so
 * this reads the slides directly rather than flattening the deck to one blob.
 */
export function pptxSlides(buf: Uint8Array): string[] {
  const files = unzipSync(buf)
  const slides = Object.keys(files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    // slide10 must sort after slide9, so compare the number, not the string.
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

  if (!slides.length) throw new Error('No slides found in that file.')

  return slides.map((name) => {
    const xml = strFromU8(files[name])
    // <a:t> holds every run of visible text on a slide.
    const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1])
    return runs
      .join(' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  })
}

/** One "page" per worksheet, each headed by its name so the model has context. */
export function xlsxSheets(buf: Uint8Array): string[] {
  const wb = XLSX.read(buf, { type: 'array' })
  if (!wb.SheetNames.length) throw new Error('No sheets found in that file.')

  return wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name], { blankrows: false })
    return `Sheet: ${name}\n${csv}`.trim()
  })
}

export const KINDS = {
  pdf:  { ext: 'pdf',  accept: 'application/pdf' },
  pptx: { ext: 'pptx', accept: '.pptx' },
  xlsx: { ext: 'xlsx', accept: '.xlsx,.xls' },
} as const

/** Which parser a file needs, from its name. */
export function kindOf(filename: string): 'pdf' | 'pptx' | 'xlsx' | null {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  return null
}
