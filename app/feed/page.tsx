import Link from 'next/link'
import { serverClient } from '@/lib/supabase-server'
import { nextCards } from '@/lib/feed'
import Feed from '@/components/Feed'
import FeedTabs from '@/components/FeedTabs'

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const db = await serverClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return <main className="centre"><p>Sign in first.</p><Link href="/">Home</Link></main>

  const { data: subjects } = await db.from('subjects')
    .select('id,name').eq('archived', false).order('created_at')
  const all = subjects ?? []
  if (!all.length) return <main className="centre"><p>Add a subject first.</p><Link href="/">Home</Link></main>

  // Fall back to For You rather than silently serving an empty feed for a bad id.
  const wanted = (await searchParams).s
  const active = all.some((s) => s.id === wanted) ? wanted : undefined
  const ids = active ? [active] : all.map((s) => s.id)

  const [{ data: priority }, { data: docs }] = await Promise.all([
    db.from('subject_priority').select('subject_id,weight'),
    db.from('documents').select('id,filename,source_type'),
  ])
  const weights = Object.fromEntries((priority ?? []).map((p) => [p.subject_id, Number(p.weight)]))
  const cards = await nextCards(db, ids, weights)
  const sources = Object.fromEntries((docs ?? []).map((d) => [d.id, { label: d.filename, type: d.source_type }]))

  return (
    <>
      <FeedTabs subjects={all} active={active} />
      {/* key forces a remount per tab: Feed seeds useState from `initial`, and a
          client-side nav would otherwise reuse the old instance and its old cards. */}
      <Feed key={active ?? 'all'} initial={cards} sources={sources} subjectIds={ids} weights={weights} />
    </>
  )
}
