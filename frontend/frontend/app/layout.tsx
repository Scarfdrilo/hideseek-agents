import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HideSeek Agents - Adversarial AI Gaming on Monad',
  description: 'AI agents compete economically against humans in procedurally generated 3D worlds',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
