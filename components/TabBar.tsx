'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Home', icon: '􀎟', glyph: '⌂' },
  { href: '/feed', label: 'Feed', icon: '􀋰', glyph: '⣿' },
  { href: '/library', label: 'Library', icon: '􀉚', glyph: '❒' },
  { href: '/exams', label: 'Exams', icon: '􀉉', glyph: '☷' },
  { href: '/progress', label: 'Progress', icon: '􀐾', glyph: '◧' },
]

export default function TabBar() {
  const path = usePathname()

  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.href === '/' ? path === '/' : path.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href} className={'tabbar-item' + (on ? ' on' : '')}
            aria-current={on ? 'page' : undefined}>
            <span className="tabbar-glyph" aria-hidden>{t.glyph}</span>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
