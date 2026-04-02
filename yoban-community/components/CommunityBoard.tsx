'use client'
import { useState, useEffect } from 'react'
import { createClient, type Post, type Announcement, type Poll } from '@/lib/supabase'
import { getSessionId, formatDateTime } from '@/lib/utils'

export default function CommunityBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [poll, setPoll] = useState<Poll | null>(null)
  const [pollVoteCounts, setPollVoteCounts] = useState<number[]>([])
  const [myVote, setMyVote] = useState<number | null>(null)
  const [showWriteForm, setShowWriteForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const sessionId = getSessionId()

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchAnnouncements(), fetchPoll(), fetchPosts()])
    setLoading(false)
  }

  async function fetchAnnouncements() {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
    setAnnouncements(data ?? [])
  }

  async function fetchPoll() {
    const { data } = await supabase
      .from('polls')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return
    setPoll(data)

    // 투표 집계
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', data.id)

    const counts = new Array(data.options.length).fill(0)
    for (const v of votes ?? []) counts[v.option_index]++
    setPollVoteCounts(counts)

    // 내 투표
    const { data: myVoteData } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', data.id)
      .eq('session_id', sessionId)
      .single()
    if (myVoteData) setMyVote(myVoteData.option_index)
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from('posts')
      .select(`*, replies:post_replies(*)`)
      .eq('is_hidden', false)
      .eq('is_secret', false)
      .order('created_at', { ascending: false })
      .limit(20)
    setPosts(data ?? [])
  }

  async function handleVote(optionIndex: number) {
    if (myVote !== null || !poll) return
    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: poll.id, option_index: optionIndex, session_id: sessionId })
    if (!error) {
      setMyVote(optionIndex)
      setPollVoteCounts(prev => {
        const next = [...prev]
        next[optionIndex]++
        return next
      })
    }
  }

  const totalVotes = pollVoteCounts.reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 pb-6 space-y-4">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-yoban-green border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* 요반 업데이트 노트 */}
          {announcements.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                📋 요반 업데이트
              </h2>
              <div className="space-y-2">
                {announcements.map(ann => (
                  <AnnouncementCard key={ann.id} ann={ann} />
                ))}
              </div>
            </section>
          )}

          {/* 투표 */}
          {poll && (
            <section>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                🗳️ 요반 투표
              </h2>
              <div className="card p-4">
                <p className="font-semibold text-gray-800 mb-3">{poll.question}</p>
                <div className="space-y-2">
                  {poll.options.map((opt, i) => {
                    const pct = totalVotes > 0 ? Math.round((pollVoteCounts[i] ?? 0) / totalVotes * 100) : 0
                    const voted = myVote === i
                    return (
                      <button
                        key={i}
                        onClick={() => handleVote(i)}
                        disabled={myVote !== null}
                        className={`w-full text-left rounded-xl overflow-hidden border transition-all
                          ${voted ? 'border-yoban-green' : 'border-gray-200'}
                          ${myVote === null ? 'active:scale-[0.98]' : ''}`}
                      >
                        <div className="relative px-4 py-2.5">
                          {myVote !== null && (
                            <div
                              className={`absolute inset-0 ${voted ? 'bg-yoban-bg' : 'bg-gray-50'} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex justify-between items-center">
                            <span className={`text-sm ${voted ? 'text-yoban-green font-semibold' : 'text-gray-700'}`}>
                              {voted && '✓ '}{opt.text}
                            </span>
                            {myVote !== null && (
                              <span className="text-xs text-gray-500">{pct}%</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {myVote !== null && (
                  <p className="text-xs text-gray-400 mt-2 text-right">총 {totalVotes}명 참여</p>
                )}
              </div>
            </section>
          )}

          {/* 게시판 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                💬 소통의 장
              </h2>
              <button
                onClick={() => setShowWriteForm(true)}
                className="text-xs text-yoban-green font-semibold bg-yoban-bg px-3 py-1.5 rounded-full"
              >
                ✏️ 글쓰기
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">
                아직 글이 없어요.<br />첫 번째로 의견을 남겨보세요! 🙌
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* 글쓰기 모달 */}
      {showWriteForm && (
        <WritePostModal
          sessionId={sessionId}
          onClose={() => setShowWriteForm(false)}
          onSubmitted={() => { setShowWriteForm(false); fetchPosts() }}
        />
      )}
    </div>
  )
}

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = ann.content.length > 80

  return (
    <div className={`card p-4 ${ann.is_pinned ? 'border-yoban-green border' : ''}`}>
      <div className="flex items-start gap-2">
        {ann.is_pinned && <span className="text-yoban-green text-xs font-bold shrink-0 mt-0.5">📌</span>}
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm mb-1">{ann.title}</p>
          <p className={`text-xs text-gray-600 leading-relaxed whitespace-pre-line ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
            {ann.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-yoban-green mt-1"
            >
              {expanded ? '접기' : '더 보기'}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">{formatDateTime(ann.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-700">{post.nickname}</span>
        <span className="text-xs text-gray-400">{formatDateTime(post.created_at)}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
      {post.replies && post.replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
          {post.replies.map(reply => (
            <div key={reply.id} className="flex gap-2">
              <span className="text-yoban-green text-xs font-bold shrink-0">요반 ↩</span>
              <p className="text-xs text-gray-600 leading-relaxed">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WritePostModal({ sessionId, onClose, onSubmitted }: {
  sessionId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from('posts').insert({
      nickname: nickname.trim(),
      content: content.trim(),
      is_secret: isSecret,
      session_id: sessionId,
    })
    if (dbError) { setError('오류가 발생했어요. 다시 시도해주세요.'); setLoading(false); return }
    onSubmitted()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">글 남기기</h3>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">닉네임 <span className="text-red-400">*</span></label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="예) 단골손님, 김반찬..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yoban-green"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">내용 <span className="text-red-400">*</span></label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="메뉴 후기, 요청사항, 하고 싶은 말을 자유롭게 적어주세요 😊"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yoban-green resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={e => setIsSecret(e.target.checked)}
              className="accent-yoban-green"
            />
            <span className="text-sm text-gray-600">🔒 비밀글 (사장님만 볼 수 있어요)</span>
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
