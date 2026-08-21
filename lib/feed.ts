import type { SupabaseClient } from '@supabase/supabase-js'

export type FeedCard = {
  id: string
  subject_id: string
  type: string
  topic: string
  difficulty: number
  payload: Record<string, unknown>
  source_page: number
  document_id: string
}

/** Round-robin across subjects so you never get a long run of one subject (§9). */
export function interleave<T extends { subject_id: string }>(cards: T[]): T[] {
  const queues = [...Map.groupBy(cards, (c) => c.subject_id).values()]
  const out: T[] = []
  while (queues.some((q) => q.length)) {
    for (const q of queues) {
      const c = q.shift()
      if (c) out.push(c)
    }
  }
  return out
}

/** All the ranking lives in the next_cards() SQL function. This just mixes subjects. */
export async function nextCards(db: SupabaseClient, subjectIds: string[], limit = 15) {
  const { data, error } = await db.rpc('next_cards', { p_subject_ids: subjectIds, p_limit: limit })
  if (error) throw error
  return interleave((data ?? []) as FeedCard[])
}
