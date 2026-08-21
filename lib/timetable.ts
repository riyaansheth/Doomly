import OpenAI from 'openai'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5'

export type ExamRow = { subject: string; date: string; time: string | null }

const SCHEMA = {
  name: 'timetable',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      exams: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Subject name as printed, e.g. "Computer Networks"' },
            date: { type: 'string', description: 'ISO date, YYYY-MM-DD' },
            time: { type: ['string', 'null'], description: 'HH:MM 24h, or null if the sheet gives no time' },
          },
          required: ['subject', 'date', 'time'],
          additionalProperties: false,
        },
      },
    },
    required: ['exams'],
    additionalProperties: false,
  },
}

/**
 * Reads an exam timetable. Timetables are dense tables with the year often
 * printed once in a header, so the current year is supplied as a fallback
 * rather than letting the model guess one.
 */
export async function readTimetable(text: string, thisYear: number): Promise<ExamRow[]> {
  const client = new OpenAI()
  const res = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_schema', json_schema: SCHEMA },
    messages: [
      {
        role: 'system',
        content: `Extract every exam from this timetable.

- Return ISO dates. If the sheet omits the year, use ${thisYear}, unless that would
  put the exam in the past by more than a month — then use ${thisYear + 1}.
- time is the start time in 24h HH:MM, or null when the sheet doesn't give one.
- Use the subject name exactly as printed; don't expand or abbreviate it.
- Ignore rows that aren't exams: holidays, instructions, room lists, invigilators.
- If it isn't a timetable at all, return an empty list.`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = JSON.parse(res.choices[0].message.content || '{"exams":[]}')
  return (raw.exams ?? []).filter((e: ExamRow) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))
}

/** "Computer Networks" should find the subject the student called "CN". */
export function matchSubject(printed: string, subjects: { id: string; name: string }[]) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const p = norm(printed)
  return (
    subjects.find((s) => norm(s.name) === p) ??
    subjects.find((s) => p.includes(norm(s.name)) || norm(s.name).includes(p)) ??
    // "Computer Networks" -> "cn", so an initialism matches a short subject name.
    subjects.find((s) => norm(s.name) === printed.split(/\s+/).map((w) => w[0]?.toLowerCase() ?? '').join(''))
  )
}
