import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'NextCRM - Commodity Trading CRM',
    template: '%s | NextCRM',
  },
  description: 'Modern commodity trading CRM system built with Next.js and Django',
  keywords: ['CRM', 'Commodity Trading', 'Next.js', 'Django', 'TypeScript'],
  authors: [{ name: 'NextCRM Team' }],
  creator: 'NextCRM',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'NextCRM - Commodity Trading CRM',
    description: 'Modern commodity trading CRM system built with Next.js and Django',
    siteName: 'NextCRM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextCRM - Commodity Trading CRM',
    description: 'Modern commodity trading CRM system built with Next.js and Django',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}