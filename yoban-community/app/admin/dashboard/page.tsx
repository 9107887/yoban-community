'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type Menu, type MenuRequest, type Announcement, type Post, type Poll } from '@/lib/supabase'
import { formatDate, formatDateTime } from '@/lib/utils'

type Tab = 'menu' | 'requests' | 'board' | 'announce' | 'poll'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('menu')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin')
      else setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-yoban-green border-t-transparent rounded-full" />
    </div>
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'menu', label: '📅 메뉴 관리' },
    { key: 'requests', label: '📩 요청 목록' },
    { key: 'board', label: '💬 게시판' },
    { key: 'announce', label: '📋 공지' },
    { key: 'poll', label: '🗳️ 투표' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-bold text-yoban-green">🥬 요반 관리자</h1>
        <button onClick={handleLogout} className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5">
          로그아웃
        </button>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-100 px-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 px-3 text-xs font-semibold whitespace-nowrap transition-colors
                ${tab === t.key
                  ? 'text-yoban-green border-b-2 border-yoban-green'
                  : 'text-gray-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4">
        {tab === 'menu'     && <MenuAdmin />}
        {tab === 'requests' && <RequestsAdmin />}
        {tab === 'board'    && <BoardAdmin />}
        {tab === 'announce' && <AnnounceAdmin />}
        {tab === 'poll'     && <PollAdmin />}
      </main>
    </div>
  )
}

// ── 메뉴 관리 ────────────────────────────────────────────────────
function MenuAdmin() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchMenus() }, [])

  async function fetchMenus() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('menus').select('*')
      .gte('date', today)
      .order('date').order('display_order')
    setMenus(data ?? [])
    setLoading(false)
  }

  async function addMenu() {
    if (!newName.trim()) return
    const maxOrder = menus.filter(m => m.date === newDate).length
    await supabase.from('menus').insert({
      date: newDate, name: newName.trim(),
      category: newCategory.trim() || null,
      display_order: maxOrder + 1
    })
    setNewName(''); setNewCategory('')
    fetchMenus()
  }

  async function deleteMenu(id: string) {
    if (!confirm('이 메뉴를 삭제할까요?')) return
    await supabase.from('menus').delete().eq('id', id)
    fetchMenus()
  }

  // 날짜별 그룹핑
  const grouped: Record<string, Menu[]> = {}
  for (const m of menus) {
    if (!grouped[m.date]) grouped[m.date] = []
    grouped[m.date].push(m)
  }

  return (
    <div className="space-y-4">
      {/* 메뉴 추가 폼 */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm">+ 메뉴 추가</h3>
        <div className="space-y-2">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="메뉴 이름 *"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
            placeholder="카테고리 (예: 육류, 나물, 김치)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          <button onClick={addMenu} className="btn-primary w-full">추가하기</button>
        </div>
      </div>

      {/* 날짜별 메뉴 목록 */}
      {loading ? <LoadingSpinner /> : Object.entries(grouped).map(([date, dayMenus]) => (
        <div key={date} className="card p-4">
          <h4 className="font-bold text-gray-700 text-sm mb-2">{formatDate(date)} ({dayMenus.length}가지)</h4>
          <div className="space-y-1.5">
            {dayMenus.map(m => (
              <div key={m.id} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-800">{m.name}</span>
                  {m.category && <span className="text-xs text-gray-400 ml-1.5">{m.category}</span>}
                </div>
                <button onClick={() => deleteMenu(m.id)} className="text-xs text-red-400 px-2 py-1 rounded-lg border border-red-100">삭제</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 메뉴 요청 관리 ───────────────────────────────────────────────
function RequestsAdmin() {
  const [requests, setRequests] = useState<MenuRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    const { data } = await supabase
      .from('menu_requests').select('*')
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'accepted' | 'declined', notes?: string) {
    await supabase.from('menu_requests').update({ status, admin_notes: notes ?? null }).eq('id', id)
    fetchRequests()
  }

  const statusLabel = { pending: '검토 중', accepted: '수락', declined: '거절' }
  const statusColor = { pending: 'text-amber-600 bg-amber-50', accepted: 'text-green-700 bg-green-50', declined: 'text-red-600 bg-red-50' }

  return (
    <div className="space-y-3">
      {loading ? <LoadingSpinner /> : requests.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">접수된 요청이 없어요</div>
      ) : requests.map(req => (
        <div key={req.id} className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{req.menu_name}</p>
              <p className="text-xs text-gray-500">{formatDate(req.requested_date)} 요청</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[req.status]}`}>
              {statusLabel[req.status]}
            </span>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 mb-2">
            <p className="text-xs text-gray-500">연락처</p>
            <p className="text-sm font-semibold text-gray-800">{req.phone_number}</p>
          </div>
          <p className="text-xs text-gray-400 mb-2">{formatDateTime(req.created_at)}</p>
          {req.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => updateStatus(req.id, 'accepted')}
                className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-xl py-2 font-semibold">
                ✓ 수락
              </button>
              <button onClick={() => updateStatus(req.id, 'declined')}
                className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl py-2 font-semibold">
                ✗ 거절
              </button>
            </div>
          )}
          {req.admin_notes && <p className="text-xs text-gray-500 mt-1">메모: {req.admin_notes}</p>}
        </div>
      ))}
    </div>
  )
}

// ── 게시판 관리 ──────────────────────────────────────────────────
function BoardAdmin() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, replies:post_replies(*)`)
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  async function hidePost(id: string) {
    await supabase.from('posts').update({ is_hidden: true }).eq('id', id)
    fetchPosts()
  }

  async function addReply(postId: string) {
    const text = replyText[postId]?.trim()
    if (!text) return
    await supabase.from('post_replies').insert({ post_id: postId, content: text })
    setReplyText(prev => ({ ...prev, [postId]: '' }))
    fetchPosts()
  }

  return (
    <div className="space-y-3">
      {loading ? <LoadingSpinner /> : posts.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">게시글이 없어요</div>
      ) : posts.map(post => (
        <div key={post.id} className={`card p-4 ${post.is_hidden ? 'opacity-50' : ''}`}>
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">{post.nickname}</span>
              {post.is_secret && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 비밀글</span>}
              {post.is_hidden && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">숨김</span>}
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(post.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-2">{post.content}</p>

          {/* 기존 답글 */}
          {post.replies && post.replies.length > 0 && (
            <div className="bg-yoban-bg rounded-xl p-3 mb-2 space-y-1">
              {post.replies.map(r => (
                <p key={r.id} className="text-xs text-gray-600">
                  <span className="font-bold text-yoban-green">요반 ↩ </span>{r.content}
                </p>
              ))}
            </div>
          )}

          {/* 답글 작성 */}
          {!post.is_hidden && (
            <div className="flex gap-2">
              <input
                value={replyText[post.id] ?? ''}
                onChange={e => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                placeholder="답글 달기..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yoban-green"
              />
              <button onClick={() => addReply(post.id)}
                className="text-xs bg-yoban-green text-white rounded-xl px-3 py-2 font-semibold">
                등록
              </button>
              <button onClick={() => hidePost(post.id)}
                className="text-xs text-gray-400 border border-gray-200 rounded-xl px-3 py-2">
                숨김
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── 공지 관리 ────────────────────────────────────────────────────
function AnnounceAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchAnn() }, [])

  async function fetchAnn() {
    const { data } = await supabase.from('announcements').select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data ?? [])
    setLoading(false)
  }

  async function addAnn() {
    if (!title.trim() || !content.trim()) return
    await supabase.from('announcements').insert({ title: title.trim(), content: content.trim(), is_pinned: isPinned })
    setTitle(''); setContent(''); setIsPinned(false)
    fetchAnn()
  }

  async function deleteAnn(id: string) {
    if (!confirm('삭제할까요?')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAnn()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm">+ 업데이트 노트 작성</h3>
        <div className="space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목 *"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용 *" rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green resize-none" />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="accent-yoban-green" />
            📌 상단 고정
          </label>
          <button onClick={addAnn} className="btn-primary w-full">등록하기</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : announcements.map(ann => (
        <div key={ann.id} className={`card p-4 ${ann.is_pinned ? 'border-yoban-green border' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {ann.is_pinned && <span className="text-xs text-yoban-green">📌</span>}
                <p className="font-semibold text-sm text-gray-800">{ann.title}</p>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{ann.content}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(ann.created_at)}</p>
            </div>
            <button onClick={() => deleteAnn(ann.id)} className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1 ml-2 shrink-0">삭제</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 투표 관리 ────────────────────────────────────────────────────
function PollAdmin() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const supabase = createClient()

  useEffect(() => { fetchPolls() }, [])

  async function fetchPolls() {
    const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false })
    setPolls(data ?? [])
    setLoading(false)
  }

  async function createPoll() {
    const validOpts = options.filter(o => o.trim())
    if (!question.trim() || validOpts.length < 2) return
    await supabase.from('polls').insert({
      question: question.trim(),
      options: validOpts.map(o => ({ text: o.trim() })),
      is_active: true
    })
    setQuestion(''); setOptions(['', ''])
    fetchPolls()
  }

  async function togglePoll(id: string, isActive: boolean) {
    await supabase.from('polls').update({ is_active: !isActive }).eq('id', id)
    fetchPolls()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3 text-sm">+ 투표 만들기</h3>
        <div className="space-y-2">
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="질문 *"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          {options.map((opt, i) => (
            <input key={i} value={opt} onChange={e => {
              const next = [...options]; next[i] = e.target.value; setOptions(next)
            }} placeholder={`선택지 ${i + 1} *`}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yoban-green" />
          ))}
          <button onClick={() => setOptions([...options, ''])} className="text-xs text-yoban-green">+ 선택지 추가</button>
          <button onClick={createPoll} className="btn-primary w-full">투표 만들기</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : polls.map(poll => (
        <div key={poll.id} className={`card p-4 ${poll.is_active ? 'border-yoban-green border' : ''}`}>
          <div className="flex items-start justify-between mb-2">
            <p className="font-semibold text-sm text-gray-800 flex-1">{poll.question}</p>
            <span className={`text-xs px-2 py-1 rounded-full ml-2 ${poll.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {poll.is_active ? '진행 중' : '종료'}
            </span>
          </div>
          <div className="space-y-1 mb-3">
            {poll.options.map((opt, i) => (
              <p key={i} className="text-xs text-gray-500">• {opt.text}</p>
            ))}
          </div>
          <button onClick={() => togglePoll(poll.id, poll.is_active)}
            className={`text-xs border rounded-xl px-4 py-2 font-semibold ${poll.is_active
              ? 'text-red-500 border-red-200' : 'text-green-700 border-green-200'}`}>
            {poll.is_active ? '투표 종료하기' : '투표 재개하기'}
          </button>
        </div>
      ))}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin w-7 h-7 border-2 border-yoban-green border-t-transparent rounded-full" />
    </div>
  )
}
