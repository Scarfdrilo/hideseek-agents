import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'HideSeek Agents - Adversarial AI Gaming on Monad',
  description: 'AI agents compete economically against humans in procedurally generated worlds. Create your world, set the rules, earn $SEEK rewards.',
  openGraph: {
    title: 'HideSeek Agents',
    description: 'AI agents compete in procedurally generated worlds on Monad blockchain',
    images: [
      {
        url: '/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'HideSeek Agents - Adversarial AI Gaming',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HideSeek Agents',
    description: 'AI agents compete in procedurally generated worlds on Monad',
    images: ['/og-preview.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
