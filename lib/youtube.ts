import { YoutubeTranscript } from 'youtube-transcript'

export const isYouTube = (s: string) => /(?:youtube\.com\/|youtu\.be\/)/i.test(s.trim())

/**
 * Transcript as one "page" per minute, so a card can cite the timestamp it came
 * from the same way a PDF card cites a page.
 * ponytail: scrapes the caption track. Breaks if YouTube changes it, and returns
 * nothing for videos without captions — both surface as a plain error.
 */
export async function transcriptPages(url: string): Promise<string[]> {
  const parts = await YoutubeTranscript.fetchTranscript(url.trim())
  if (!parts.length) throw new Error('That video has no captions to read.')

  const byMinute = new Map<number, string[]>()
  for (const p of parts) {
    const minute = Math.floor(p.offset / 60000)
    const bucket = byMinute.get(minute) ?? []
    bucket.push(p.text.replace(/\s+/g, ' '))
    byMinute.set(minute, bucket)
  }

  const last = Math.max(...byMinute.keys())
  return Array.from({ length: last + 1 }, (_, i) => (byMinute.get(i) ?? []).join(' '))
}

/** 7 -> "7:00", used for the citation under a card built from a video. */
export const timestamp = (minute: number) => `${minute}:00`
