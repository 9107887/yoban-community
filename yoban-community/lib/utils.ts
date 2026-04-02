// ── 세션 ID 관리 ──────────────────────────────────────────────────
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = localStorage.getItem('yoban_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('yoban_session_id', sessionId)
  }
  return sessionId
}

// ── 전화번호 저장/불러오기 (localStorage) ─────────────────────────
export function getSavedPhone(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('yoban_phone') ?? ''
}
export function savePhone(phone: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('yoban_phone', phone)
}

// ── 날짜 유틸 ─────────────────────────────────────────────────────
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAYS_KO[d.getDay()]
  return `${month}/${day} (${dow})`
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${month}/${day} ${hour}:${min}`
}

// 오늘부터 n일간의 날짜 배열 반환 (YYYY-MM-DD)
export function getWeekDates(startOffset = 0): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = startOffset; i < startOffset + 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

// 메뉴 요청 마감 기한: 요청 날짜 - 2 영업일 오후 7시
export function getRequestDeadline(targetDate: string): Date {
  const d = new Date(targetDate + 'T19:00:00')
  let businessDaysBack = 0
  while (businessDaysBack < 2) {
    d.setDate(d.getDate() - 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) businessDaysBack++
  }
  return d
}

export function isRequestable(targetDate: string): boolean {
  const deadline = getRequestDeadline(targetDate)
  return new Date() < deadline
}

export function getDeadlineText(targetDate: string): string {
  const deadline = getRequestDeadline(targetDate)
  const month = deadline.getMonth() + 1
  const day = deadline.getDate()
  const dow = DAYS_KO[deadline.getDay()]
  return `${month}/${day}(${dow}) 오후 7시까지 요청 가능`
}
