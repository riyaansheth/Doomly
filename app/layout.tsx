import type { Metadata } from 'next'
import './globals.css'
import TabBar from '@/components/TabBar'

export const metadata: Metadata = {
  title: 'Doomly',
  description: 'Doomscroll your syllabus.',
}

// Runs before first paint, so the saved theme doesn't flash the wrong one.
const noFlash = `document.documentElement.dataset.theme =
  localStorage.getItem('theme') ||
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>{children}<TabBar /></body>
    </html>
  )
}
