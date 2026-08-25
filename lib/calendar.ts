export type Exam = { name: string; exam_date: string; exam_time: string | null }

const EXAM_MINUTES = 180        // 3h is the usual university slot
const DEFAULT_TIME = '09:00'

// Calendar events outlive the session that made them, so the link inside one
// must point at the deployed site, never at whatever host generated it.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://riyaansheth.tech'

/** Exam start as a real instant, in whatever timezone the caller is in. */
export const examStart = (e: Exam) => new Date(`${e.exam_date}T${(e.exam_time ?? DEFAULT_TIME).slice(0, 5)}:00`)

const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}Z/g, '').slice(0, 15)

/**
 * Floating local time — deliberately no trailing Z. An exam is at 9am *where the
 * student is*, not at an absolute instant, so both Google and .ics should read it
 * in the viewer's own timezone. It also makes the output independent of whether
 * this runs on the server or in the browser, which a UTC instant is not.
 */
const window = (e: Exam) => {
  const [y, m, d] = e.exam_date.split('-').map(Number)
  const [hh, mm] = (e.exam_time ?? DEFAULT_TIME).slice(0, 5).split(':').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const end = new Date(start.getTime() + EXAM_MINUTES * 60_000)
  return `${stamp(start)}/${stamp(end)}`
}

/**
 * A prefilled Google Calendar event. No OAuth, no API, no tokens — the student
 * confirms it once and Google owns the reminders from then on.
 */
export function googleCalendarUrl(e: Exam) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${e.name} exam`,
    dates: window(e),
    details: `Added by Doomly. Revise: ${SITE}/feed`,
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

/** One .ics for every exam, for people who'd rather import the lot at once. */
export function ics(exams: Exam[]) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Doomly//Exams//EN', 'CALSCALE:GREGORIAN',
    ...exams.flatMap((e, i) => [
      'BEGIN:VEVENT',
      `UID:doomly-${i}-${e.exam_date}@doomly`,
      `DTSTAMP:${stamp(new Date(0))}`,      // fixed: a changing stamp makes re-imports look new
      `DTSTART:${window(e).split('/')[0]}`,
      `DTEND:${window(e).split('/')[1]}`,
      `SUMMARY:${e.name} exam`,
      `DESCRIPTION:Added by Doomly. Revise: ${SITE}/feed`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Exam tomorrow', 'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')          // RFC 5545 wants CRLF
}

/** Whole days from today until the exam. Negative once it's past. */
export const daysUntil = (e: Exam) =>
  Math.ceil((examStart(e).getTime() - Date.now()) / 86_400_000)
