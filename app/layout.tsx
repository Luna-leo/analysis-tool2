import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chinami\'s Analysis App',
  description: 'Created with Chinami',
  generator: 'Chinami.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
