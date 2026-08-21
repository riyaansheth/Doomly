import Link from 'next/link'

export default function FeedTabs({ subjects, active }:
  { subjects: { id: string; name: string }[]; active?: string }) {
  if (subjects.length < 2) return null   // nothing to switch between

  return (
    <nav className="tabs">
      <Link className={'tab' + (active ? '' : ' on')} href="/feed">For you</Link>
      {subjects.map((s) => (
        <Link key={s.id} className={'tab' + (active === s.id ? ' on' : '')} href={`/feed?s=${s.id}`}>
          {s.name}
        </Link>
      ))}
    </nav>
  )
}
