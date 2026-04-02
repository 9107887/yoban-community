import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── 타입 정의 ──────────────────────────────────────────────────────

export type Menu = {
  id: string
  date: string
  name: string
  category: string | null
  display_order: number
  like_count?: number
  user_liked?: boolean
}

export type MenuRequest = {
  id: string
  requested_date: string
  menu_name: string
  phone_number: string
  status: 'pending' | 'accepted' | 'declined'
  admin_notes: string | null
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
}

export type Post = {
  id: string
  nickname: string
  content: string
  is_secret: boolean
  session_id: string
  is_hidden: boolean
  created_at: string
  replies?: PostReply[]
}

export type PostReply = {
  id: string
  post_id: string
  content: string
  created_at: string
}

export type Poll = {
  id: string
  question: string
  options: { text: string }[]
  is_active: boolean
  ends_at: string | null
  created_at: string
  vote_counts?: number[]
  user_voted?: number | null
}
