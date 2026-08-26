'use client'
import { useCallback, useEffect, useState } from 'react'
import { browserClient } from './supabase'

export type Subject = {
  id: string; name: string; exam_date: string | null; exam_time: string | null
  archived: boolean; semester: string | null; order_mode: string
}

const COLUMNS = 'id,name,exam_date,exam_time,archived,semester,order_mode'

/**
 * Every page needs the signed-in user and the subject list, so the anonymous
 * bootstrap lives here once instead of being copied into each one.
 *
 * No login step: an anonymous Supabase user is still a real auth.users row, so
 * every RLS policy keeps working untouched and there is nothing to sign into.
 * ponytail: account lives in this browser's cookies. Add email sign-in when you
 * need the same account on a second device.
 */
/**
 * An anonymous session can expire, and when it does reads keep working from a
 * cached token while every write is rejected — which looks exactly like "the
 * button does nothing". Retry once against a fresh session before giving up.
 */
type Result = { error: { message: string; code?: string } | null }

export async function withAuthRetry(
  db: ReturnType<typeof browserClient>,
  run: () => PromiseLike<Result>,
): Promise<Result> {
  let res = await run()
  const expired = res.error && /jwt|token|expired|401|PGRST301/i.test(res.error.message + (res.error.code ?? ''))
  if (expired) {
    await db.auth.signInAnonymously()
    res = await run()
  }
  return res
}

export function useSession() {
  const [db] = useState(browserClient)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')
  // Distinct from "has subjects": an empty library is a loaded library.
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await db.from('subjects').select(COLUMNS).order('created_at')
    setSubjects((data ?? []) as Subject[])
    setReady(true)
  }, [db])

  useEffect(() => {
    db.auth.getUser().then(async ({ data }) => {
      const u = data.user ?? (await db.auth.signInAnonymously()).data.user
      if (!u) return setError('Enable Anonymous sign-ins: Supabase → Authentication → Sign In / Providers')
      setUser(u)
      refresh()
    })
  }, [db, refresh])

  // Never swallow a failed write — silence is indistinguishable from a broken button.
  const patch = async (id: string, fields: Partial<Subject>) => {
    const { error: e } = await withAuthRetry(db, () => db.from('subjects').update(fields).eq('id', id))
    if (e) return setError(`Couldn't save that: ${e.message}`)
    setError('')
    refresh()
  }

  return { db, user, subjects, error, setError, ready, refresh, patch }
}

/** Subjects that actually have an exam on the calendar. */
export const dated = (subjects: Subject[]) =>
  subjects.filter((s): s is Subject & { exam_date: string } => !!s.exam_date)
