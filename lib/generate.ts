import OpenAI from 'openai'

const MODEL = process.env.OPENAI_MODEL || 'gpt-5'
const PAGES_PER_CHUNK = 3

export type CardType = 'concept' | 'mcq' | 'code_bite' | 'exam_trap' | 'true_false'
export type Card = {
  type: CardType
  topic: string
  difficulty: number
  source_page: number
  payload: Record<string, unknown>
}

/** Split per-page text into chunks, keeping page numbers visible to the model. */
export function chunk(pages: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < pages.length; i += PAGES_PER_CHUNK) {
    const text = pages
      .slice(i, i + PAGES_PER_CHUNK)
      .map((p, j) => `[page ${i + j + 1}]\n${p}`)
      .join('\n\n')
      .trim()
    if (text.replace(/\[page \d+\]/g, '').trim().length > 200) out.push(text)
  }
  return out
}

const payloadFor: Record<CardType, string[]> = {
  concept: ['title', 'body'],
  mcq: ['question', 'options', 'answerIndex', 'why'],
  code_bite: ['code', 'question', 'answer'],
  exam_trap: ['claim', 'reality'],
  true_false: ['statement', 'isTrue', 'why'],
}

const obj = (props: Record<string, unknown>) => ({
  type: 'object',
  properties: props,
  required: Object.keys(props),
  additionalProperties: false,
})

const str = { type: 'string' }

const SCHEMA = {
  name: 'cards',
  strict: true,
  schema: obj({
    cards: {
      type: 'array',
      items: obj({
        type: { type: 'string', enum: Object.keys(payloadFor) },
        topic: { type: 'string', description: 'Short topic name, e.g. "Stacks". Reuse names across cards.' },
        difficulty: { type: 'integer', minimum: 1, maximum: 5 },
        source_page: { type: 'integer', description: 'The [page N] marker this card came from.' },
        payload: {
          anyOf: [
            obj({ title: str, body: str }),
            obj({ question: str, options: { type: 'array', items: str }, answerIndex: { type: 'integer' }, why: str }),
            obj({ code: str, question: str, answer: str }),
            obj({ claim: str, reality: str }),
            obj({ statement: str, isTrue: { type: 'boolean' }, why: str }),
          ],
        },
      }),
    },
  }),
}

const PROMPT = `You turn a student's own course material into short scrollable learning cards.

TEACH BEFORE YOU TEST. This is the rule that matters most. The student has never
seen this material. For every topic you touch, write the concept card that
explains it from scratch FIRST, and only then write questions about it. Never ask
something the concept cards in this same batch don't already give them what they
need to answer.

Build a ladder inside each topic, using difficulty to mark the rung:
  1  what it is, in plain words
  2  its parts and the vocabulary for them
  3  how it behaves / what it does
  4  a subtlety, trade-off or comparison
  5  apply it under exam pressure
Start every new topic at 1. Don't jump to 4 because the source text happens to
be advanced — break it down.

Rules:
- Use ONLY the supplied text. Never add outside facts. If the text is thin, produce fewer cards.
- Every card must set source_page to the [page N] marker its content came from.
- Rotate formats. A run of question/answer cards is boring; mix concept, mcq, code_bite,
  exam_trap and true_false so the feed keeps changing shape.
- A concept card should actually explain: 2-4 sentences, a concrete image or example,
  no restating the title. This is the card doing the teaching, so make it carry its weight.
- Only use code_bite when the material actually contains code or pseudocode.
- exam_trap = a specific confusion a student would lose marks on, with the correction.
  It assumes the concept is already understood, so never make it the first card on a topic.
- Keep every card readable in a few seconds on a phone. No walls of text.
- topic must be a short reusable name; use the SAME name for the same concept across cards.

Produce 6-10 cards.`

/** One chunk in, cards out. Topic and difficulty come back as fields — no second pass. */
export async function generateCards(text: string): Promise<Card[]> {
  const client = new OpenAI()
  const res = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_schema', json_schema: SCHEMA },
    messages: [
      { role: 'system', content: PROMPT },
      { role: 'user', content: text },
    ],
  })

  const raw = JSON.parse(res.choices[0].message.content || '{"cards":[]}')
  // The schema can't tie `type` to its payload variant, so check that here.
  return (raw.cards ?? []).filter(
    (c: Card) =>
      payloadFor[c.type] && payloadFor[c.type].every((k) => c.payload?.[k] !== undefined),
  )
}
