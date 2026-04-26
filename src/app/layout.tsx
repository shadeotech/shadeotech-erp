import type { Metadata } from 'next'
import {
  Inter,
  Dancing_Script,
  Great_Vibes,
  Sacramento,
  Yellowtail,
  Marck_Script,
  La_Belle_Aurore,
  Bilbo_Swash_Caps,
  Qwigley,
} from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing-script', display: 'swap' })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-great-vibes', display: 'swap' })
const sacramento = Sacramento({ subsets: ['latin'], weight: '400', variable: '--font-sacramento', display: 'swap' })
const yellowtail = Yellowtail({ subsets: ['latin'], weight: '400', variable: '--font-yellowtail', display: 'swap' })
const marckScript = Marck_Script({ subsets: ['latin'], weight: '400', variable: '--font-marck-script', display: 'swap' })
const laBelleAurore = La_Belle_Aurore({ subsets: ['latin'], weight: '400', variable: '--font-la-belle-aurore', display: 'swap' })
const bilboSwashCaps = Bilbo_Swash_Caps({ subsets: ['latin'], weight: '400', variable: '--font-bilbo-swash-caps', display: 'swap' })
const qwigley = Qwigley({ subsets: ['latin'], weight: '400', variable: '--font-qwigley', display: 'swap' })

export const metadata: Metadata = {
  title: 'Shadeotech Management System',
  description: 'Comprehensive management system for blinds and shade manufacturing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${dancingScript.variable} ${greatVibes.variable} ${sacramento.variable} ${yellowtail.variable} ${marckScript.variable} ${laBelleAurore.variable} ${bilboSwashCaps.variable} ${qwigley.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

