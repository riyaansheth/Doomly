import type { Metadata, Viewport } from 'next'
import { Newsreader } from 'next/font/google'
import './globals.css'
import TabBar from '@/components/TabBar'

// The one webfont, on the one element that earns it: the card question.
// Subset to latin, swap so text never blocks on it.
const serif = Newsreader({
  subsets: ['latin'], weight: ['500', '600'], style: ['normal'],
  display: 'swap', variable: '--serif',
})

export const metadata: Metadata = {
  title: 'Doomly',
  description: 'Doomscroll your syllabus.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Doomly', statusBarStyle: 'black-translucent' },
  icons: { apple: '/apple-touch-icon.png', icon: '/favicon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // No pinch-zoom-out past 1: a snap feed that can be zoomed out is unusable.
  // maximumScale is deliberately left open so pinch-to-zoom still works for
  // anyone who needs it — capping it would be an accessibility regression.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

// Runs before first paint, so the saved theme doesn't flash the wrong one.
const noFlash = `document.documentElement.dataset.theme =
  localStorage.getItem('theme') ||
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>{children}<TabBar /></body>
    </html>
  )
}
