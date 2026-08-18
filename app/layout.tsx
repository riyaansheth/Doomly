import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Doomly',
  description: 'Doomscroll your syllabus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
