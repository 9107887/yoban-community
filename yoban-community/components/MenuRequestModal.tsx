'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, getDeadlineText, getSavedPhone, savePhone } from '@/lib/utils'

interface Props {
  date: string
  onClose: () => void
}

export default function MenuRequestModal({ date, onClose }: Props) {
  const [menuName, setMenuName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // localStorage에서 저장된 전화번호 불러오기
    const saved = getSavedPhone()
    if (saved) setPhone(saved)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!menuName.trim()) { setError('메뉴 이름을 입력해주세요.'); return }
    if (!phone.trim()) { setError('전화번호를 입력해주세요.'); return }
    if (!consent) { setError('개인정보 수집에 동의해주세요.'); return }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('menu_requests')
      .insert({ requested_date: date, menu_name: menuName.trim(), phone_number: phone.trim() })

    if (dbError) {
      setError('요청 중 오류가 발생했어요. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    // 전화번호 저장
    savePhone(phone.trim())
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-8">
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">요청이 접수됐어요!</h3>
            <p className="text-sm text-gray-500 mb-6">
              검토 후 문자로 연락드릴게요.<br />
              기다려주셔서 감사합니다 😊
            </p>
            <button onClick={onClose} className="btn-primary w-full">확인</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">메뉴 요청하기</h3>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(date)} · {getDeadlineText(date)}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  원하시는 메뉴 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={e => setMenuName(e.target.value)}
                  placeholder="예) 순두부찌개, 멸치볶음..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yoban-green"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  연락처 <span className="text-red-400">*</span>
                  {getSavedPhone() && phone === getSavedPhone() && (
                    <span className="text-xs text-yoban-green font-normal ml-2">저장된 번호</span>
                  )}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yoban-green"
                />
              </div>

              {/* 개인정보 동의 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 accent-yoban-green"
                  />
                  <div className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">[개인정보 수집·이용 동의]</span><br />
                    ▪ 수집 항목: 휴대폰 번호<br />
                    ▪ 수집 목적: 메뉴 요청 검토 및 결과 안내 문자 발송<br />
                    ▪ 보유 기간: 요청 처리 완료 후 30일 이내 파기<br />
                    ▪ 동의 거부 시 메뉴 요청 서비스 이용 불가
                  </div>
                </label>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '접수 중...' : '요청 접수하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
