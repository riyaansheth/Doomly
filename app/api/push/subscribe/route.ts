import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const sub = await req.json()
  const db = await serverClient()

  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // endpoint is unique, so re-subscribing on the same device updates in place.
  const { error } = await db.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
