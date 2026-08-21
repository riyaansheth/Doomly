import type { Metadata } from 'next'
import { Archivo_Black, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Display: heavy grotesque, used only for the question itself.
const display = Archivo_Black({ weight: '400', subsets: ['latin'], variable: '--display' })
// Everything else is mono — this is a syllabus of compilers and packet headers.
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' })

export const metadata: Metadata = {
  title: 'Doomly',
  description: 'Doomscroll your syllabus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
