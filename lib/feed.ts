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

/**
 * Mixes subjects in proportion to weight, without ever running one subject for
 * long. Each slot goes to whichever subject currently has the best
 * weight-per-card-served ratio, which is proportional in aggregate and
 * self-correcting slot by slot. Within a subject the order from next_cards() is
 * preserved untouched.
 */
export function weightedInterleave<T extends { subject_id: string }>(
  cards: T[],
  weights: Record<string, number> = {},
): T[] {
  const queues = Map.groupBy(cards, (c) => c.subject_id)
  const served = new Map([...queues.keys()].map((k) => [k, 0]))
  const out: T[] = []

  while (true) {
    let pick: string | undefined
    let best = -Infinity
    for (const [id, queue] of queues) {
      if (!queue.length) continue
      const score = (weights[id] ?? 1) / (served.get(id)! + 1)
      if (score > best) { best = score; pick = id }   // ties keep insertion order
    }
    if (pick === undefined) return out
    out.push(queues.get(pick)!.shift()!)
    served.set(pick, served.get(pick)! + 1)
  }
}

/** Equal weights — the plain round-robin case. */
export const interleave = <T extends { subject_id: string }>(cards: T[]): T[] =>
  weightedInterleave(cards)

/** All the ranking lives in the next_cards() SQL function. This just mixes subjects. */
export async function nextCards(
  db: SupabaseClient,
  subjectIds: string[],
  weights: Record<string, number> = {},
  limit = 15,
) {
  const { data, error } = await db.rpc('next_cards', { p_subject_ids: subjectIds, p_limit: limit })
  if (error) throw error
  return weightedInterleave((data ?? []) as FeedCard[], weights)
}
