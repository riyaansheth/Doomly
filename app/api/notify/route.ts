import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const REMIND_AT = [7, 3, 1, 0]     // days before the exam

/**
 * Runs on a schedule, so it has no user session and uses the secret key to read
 * every user's subscriptions. Guarded by CRON_SECRET.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: 'SUPABASE_SECRET_KEY not set' }, { status: 500 })
  }

  webpush.setVapidDetails(
    'mailto:noreply@doomly.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY)

  const { data: subjects } = await db.from('subjects')
    .select('id,user_id,name,exam_date').not('exam_date', 'is', null).eq('archived', false)

  const today = new Date().toISOString().slice(0, 10)
  const due = (subjects ?? [])
    .map((s) => ({ ...s, out: Math.round((Date.parse(s.exam_date) - Date.parse(today)) / 86_400_000) }))
    .filter((s) => REMIND_AT.includes(s.out))

  let sent = 0, pruned = 0
  for (const s of due) {
    // Primary key on (subject_id, days_out) makes a second run that day a no-op.
    const { error: dupe } = await db.from('sent_reminders')
      .insert({ subject_id: s.id, days_out: s.out })
    if (dupe) continue

    const { data: subs } = await db.from('push_subscriptions').select('*').eq('user_id', s.user_id)
    for (const p of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } },
          JSON.stringify({
            title: `${s.name} exam ${s.out === 0 ? 'today' : s.out === 1 ? 'tomorrow' : `in ${s.out} days`}`,
            body: 'Open Doomly and get a few rounds in.',
            tag: `exam-${s.id}`,
            url: '/feed',
          }),
        )
        sent++
      } catch (e) {
        // 404/410 mean the browser threw the subscription away; stop storing it.
        if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) {
          await db.from('push_subscriptions').delete().eq('endpoint', p.endpoint)
          pruned++
        }
      }
    }
  }

  return NextResponse.json({ checked: subjects?.length ?? 0, due: due.length, sent, pruned })
}
