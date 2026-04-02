import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '요반 소통공간 | 요리하는반찬가게',
  description: '메뉴 미리보기, 요청, 피드백을 한 곳에서!',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="max-w-lg mx-auto min-h-screen">{children}</body>
    </html>
  )
}
