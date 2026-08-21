import type { Metadata } from 'next'
import { Nunito, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const sans = Nunito({ subsets: ['latin'], variable: '--sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' })

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
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: noFlash }} /></head>
      <body>{children}</body>
    </html>
  )
}
