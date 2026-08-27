import type { Config } from '@netlify/functions'

/**
 * Fires the reminder route on a schedule. The route already knows how to find
 * due exams, dedupe and send, so this only supplies the trigger a serverless
 * host can't otherwise provide.
 *
 * Netlify runs scheduled functions in UTC, and 09:00 UTC is 14:30 in IST — not
 * when anyone wants to hear about an exam. 03:30 UTC is 09:00 IST.
 */
export default async () => {
  const base = process.env.URL              // Netlify supplies the live site URL
  const secret = process.env.CRON_SECRET

  if (!base || !secret) {
    console.error('exam-reminders: URL or CRON_SECRET missing; nothing sent')
    return new Response('not configured', { status: 500 })
  }

  const res = await fetch(`${base}/api/notify`, {
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  console.log('exam-reminders:', res.status, body)
  return new Response(body, { status: res.status })
}

export const config: Config = {
  schedule: '30 3 * * *',                   // 09:00 IST
}
