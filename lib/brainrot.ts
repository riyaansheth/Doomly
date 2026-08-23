export type Retold = { title: string; body: string } | null | undefined

// A true_false statement IS the thing being judged, so restating it risks
// flipping its truth. Its explanation is still safe to retell.
const HEADLINE_SAFE = new Set(['concept', 'mcq', 'code_bite', 'exam_trap'])

/**
 * What to actually render. Falls back to the real text whenever brainrot is off
 * or missing — cards generated before this feature simply have none.
 */
export function retell(
  on: boolean,
  type: string,
  brainrot: Retold,
  title: string,
  body?: string,
): { title: string; body?: string } {
  if (!on || !brainrot?.title) return { title, body }
  return {
    title: HEADLINE_SAFE.has(type) ? brainrot.title : title,
    body: brainrot.body || body,
  }
}
