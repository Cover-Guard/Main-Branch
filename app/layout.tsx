import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'CoverGuard - Property Insurability Intelligence',
    template: '%s | CoverGuard',
  },
  description:
    'Search any property to instantly understand flood, fire, earthquake, and crime risks - and estimate true insurance costs before you bid.',
  keywords: ['property insurance', 'home insurance estimate', 'flood risk', 'fire risk', 'real estate due diligence'],
  openGraph: {
    title: 'CoverGuard',
    description: 'Know the true insurance cost of any property before you bid.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
