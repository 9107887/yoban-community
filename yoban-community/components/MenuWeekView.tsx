'use client'
import { useState, useEffect } from 'react'
import { createClient, type Menu } from '@/lib/supabase'
import { getSessionId, getWeekDates, formatDate, isRequestable, getDeadlineText } from '@/lib/utils'
import MenuRequestModal from './MenuRequestModal'

export default function MenuWeekView() {
  const [menus, setMenus] = useState<Record<string, Menu[]>>({})
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [likedMenus, setLikedMenus] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [weekOffset, setWeekOffset] = useState(0)
  const [requestDate, setRequestDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(weekOffset * 7)
  const supabase = createClient()
  const sessionId = getSessionId()

  useEffect(() => { fetchMenus() }, [weekOffset])

  async function fetchMenus() {
    setLoading(true)
    const start = weekDates[0]
    const end = weekDates[6]

    const { data: menuData } = await supabase
      .from('menus')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('display_order')

    if (!menuData) { setLoading(false); return }

    // 날짜별로 그룹핑
    const grouped: Record<string, Menu[]> = {}
    for (const m of menuData) {
      if (!grouped[m.date]) grouped[m.date] = []
      grouped[m.date].push(m)
    }
    setMenus(grouped)

    // 좋아요 수 가져오기
    const menuIds = menuData.map(m => m.id)
    if (menuIds.length > 0) {
      const { data: likeData } = await supabase
        .from('menu_likes')
        .select('menu_id')
        .in('menu_id', menuIds)

      const counts: Record<string, number> = {}
      const myLikes = new Set<string>()
      for (const like of likeData ?? []) {
        counts[like.menu_id] = (counts[like.menu_id] ?? 0) + 1
      }

      // 내 세션 좋아요
      const { data: myLikeData } = await supabase
        .from('menu_likes')
        .select('menu_id')
        .in('menu_id', menuIds)
        .eq('session_id', sessionId)
      for (const l of myLikeData ?? []) myLikes.add(l.menu_id)

      setLikeCounts(counts)
      setLikedMenus(myLikes)
    }
    setLoading(false)
  }

  async function toggleLike(menuId: string) {
    if (likedMenus.has(menuId)) return  // 이미 눌렀으면 취소 불가 (세션 기반)
    const { error } = await supabase
      .from('menu_likes')
      .insert({ menu_id: menuId, session_id: sessionId })
    if (!error) {
      setLikedMenus(prev => new Set([...prev, menuId]))
      setLikeCounts(prev => ({ ...prev, [menuId]: (prev[menuId] ?? 0) + 1 }))
    }
  }

  function toggleDay(date: string) {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="px-4 pb-6">
      {/* 초안 안내 배너 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2 items-start">
        <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          이 메뉴표는 <strong>초안</strong>입니다. 재료 수급 상황이나 고객 요청에 따라 변경될 수 있어요.
        </p>
      </div>

      {/* 주차 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 active:scale-95 transition-transform"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {weekOffset === 0 ? '이번 주' : weekOffset === 1 ? '다음 주' : weekOffset === -1 ? '지난 주' : `${weekOffset > 0 ? '+' : ''}${weekOffset}주`}
          <span className="text-gray-400 font-normal ml-1">
            ({weekDates[0].slice(5).replace('-', '/')}~{weekDates[6].slice(5).replace('-', '/')})
          </span>
        </span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 active:scale-95 transition-transform"
        >
          ›
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-yoban-green border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map(date => {
            const dayMenus = menus[date] ?? []
            const isExpanded = expandedDays[date] ?? false
            const isToday = date === today
            const hasMenus = dayMenus.length > 0
            const canRequest = isRequestable(date)

            return (
              <div key={date} className={`card overflow-hidden ${isToday ? 'ring-2 ring-yoban-green' : ''}`}>
                {/* 날짜 헤더 */}
                <button
                  onClick={() => hasMenus && toggleDay(date)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-xs bg-yoban-green text-white px-2 py-0.5 rounded-full font-semibold">오늘</span>
                    )}
                    <span className={`font-semibold ${isToday ? 'text-yoban-green' : 'text-gray-700'}`}>
                      {formatDate(date)}
                    </span>
                    {hasMenus && (
                      <span className="text-xs text-gray-400">{dayMenus.length}가지</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasMenus && (
                      <span className="text-xs text-gray-400">메뉴 준비 중</span>
                    )}
                    {hasMenus && (
                      <span className="text-gray-400 text-lg">{isExpanded ? '▲' : '▼'}</span>
                    )}
                  </div>
                </button>

                {/* 미리보기 (접힌 상태: 상위 3개) */}
                {hasMenus && !isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    {/* 메뉴 요청 버튼 */}
                    {canRequest && (
                      <button
                        onClick={() => setRequestDate(date)}
                        className="w-full text-left text-xs text-yoban-green font-semibold py-2 flex items-center gap-1"
                      >
                        <span>＋</span> 이 날 메뉴 요청하기
                      </button>
                    )}
                    <div className="space-y-1.5">
                      {dayMenus.slice(0, 3).map(menu => (
                        <MenuItemRow
                          key={menu.id}
                          menu={menu}
                          liked={likedMenus.has(menu.id)}
                          likeCount={likeCounts[menu.id] ?? 0}
                          onLike={() => toggleLike(menu.id)}
                        />
                      ))}
                      {dayMenus.length > 3 && (
                        <button
                          onClick={() => toggleDay(date)}
                          className="text-xs text-yoban-green font-semibold py-1"
                        >
                          + {dayMenus.length - 3}가지 더 보기
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 전체 메뉴 (펼친 상태) */}
                {hasMenus && isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    {canRequest && (
                      <button
                        onClick={() => setRequestDate(date)}
                        className="w-full text-left text-xs text-yoban-green font-semibold py-2 flex items-center gap-1"
                      >
                        <span>＋</span> 이 날 메뉴 요청하기
                        <span className="text-gray-400 font-normal">({getDeadlineText(date)})</span>
                      </button>
                    )}
                    {!canRequest && (
                      <p className="text-xs text-gray-400 py-2">이 날 메뉴 요청 마감</p>
                    )}
                    <div className="space-y-1.5">
                      {dayMenus.map(menu => (
                        <MenuItemRow
                          key={menu.id}
                          menu={menu}
                          liked={likedMenus.has(menu.id)}
                          likeCount={likeCounts[menu.id] ?? 0}
                          onLike={() => toggleLike(menu.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 메뉴 요청 모달 */}
      {requestDate && (
        <MenuRequestModal
          date={requestDate}
          onClose={() => setRequestDate(null)}
        />
      )}
    </div>
  )
}

function MenuItemRow({
  menu, liked, likeCount, onLike
}: {
  menu: Menu
  liked: boolean
  likeCount: number
  onLike: () => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm text-gray-800">{menu.name}</span>
        {menu.category && (
          <span className="text-xs text-gray-400 ml-1.5">{menu.category}</span>
        )}
      </div>
      <button
        onClick={onLike}
        className={`like-btn ${liked ? 'like-btn-active' : 'like-btn-inactive'}`}
      >
        <span>{liked ? '♥' : '♡'}</span>
        <span>{liked ? '꼭해주세요' : '꼭해주세요'}</span>
        {likeCount > 0 && <span className="font-semibold">{likeCount}</span>}
      </button>
    </div>
  )
}
