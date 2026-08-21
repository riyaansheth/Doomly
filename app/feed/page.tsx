import Link from 'next/link'
import { serverClient } from '@/lib/supabase-server'
import { nextCards } from '@/lib/feed'
import Feed from '@/components/Feed'

export default async function FeedPage() {
  const db = await serverClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return <main className="centre"><p>Sign in first.</p><Link href="/">Home</Link></main>

  const { data: subjects } = await db.from('subjects').select('id')
  const ids = (subjects ?? []).map((s) => s.id)
  if (!ids.length) return <main className="centre"><p>Add a subject first.</p><Link href="/">Home</Link></main>

  const [cards, { data: docs }] = await Promise.all([
    nextCards(db, ids),
    db.from('documents').select('id,filename,source_type'),
  ])
  const sources = Object.fromEntries((docs ?? []).map((d) => [d.id, { label: d.filename, type: d.source_type }]))

  return <Feed initial={cards} sources={sources} subjectIds={ids} />
}
