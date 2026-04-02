'use client'
import { useState } from 'react'
import MenuWeekView from '@/components/MenuWeekView'
import CommunityBoard from '@/components/CommunityBoard'

export default function Home() {
  const [tab, setTab] = useState<'menu' | 'community'>('menu')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-yoban-green">🥬 요반</h1>
              <p className="text-xs text-gray-400">요리하는반찬가게</p>
            </div>
            <a
              href="https://요반쇼핑몰주소.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-yoban-green text-white px-3 py-1.5 rounded-full font-semibold"
            >
              쇼핑몰 가기 →
            </a>
          </div>

          {/* 탭 */}
          <div className="flex gap-1">
            <button
              onClick={() => setTab('menu')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-t-xl transition-colors
                ${tab === 'menu'
                  ? 'text-yoban-green border-b-2 border-yoban-green bg-yoban-bg'
                  : 'text-gray-400'}`}
            >
              📅 주간 메뉴표
            </button>
            <button
              onClick={() => setTab('community')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-t-xl transition-colors
                ${tab === 'community'
                  ? 'text-yoban-green border-b-2 border-yoban-green bg-yoban-bg'
                  : 'text-gray-400'}`}
            >
              💬 소통의 장
            </button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="pt-4">
        {tab === 'menu' ? <MenuWeekView /> : <CommunityBoard />}
      </main>
    </div>
  )
}
