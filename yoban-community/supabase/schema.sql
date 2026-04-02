-- ================================================================
-- 요반 고객소통 플랫폼 - Supabase DB 스키마
-- 사용법: Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 실행
-- ================================================================

-- ── 1. 메뉴 ──────────────────────────────────────────────────────
create table menus (
  id           uuid default gen_random_uuid() primary key,
  date         date not null,
  name         text not null,
  category     text,
  display_order int default 0,
  created_at   timestamptz default now()
);

-- 날짜별 조회 인덱스
create index idx_menus_date on menus(date);

-- 2. 꼭해주세요 클릭 ───────────────────────────────────────────────
create table menu_likes (
  id         uuid default gen_random_uuid() primary key,
  menu_id    uuid references menus(id) on delete cascade,
  session_id text not null,
  created_at timestamptz default now(),
  unique(menu_id, session_id)   -- 세션당 1회만 가능
);

-- 3. 메뉴 요청 ────────────────────────────────────────────────────
create table menu_requests (
  id             uuid default gen_random_uuid() primary key,
  requested_date date not null,
  menu_name      text not null,
  phone_number   text not null,  -- 관리자만 열람 (RLS로 보호)
  status         text default 'pending' check (status in ('pending','accepted','declined')),
  admin_notes    text,
  created_at     timestamptz default now()
);

-- 4. 요반 업데이트 노트 ───────────────────────────────────────────
create table announcements (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  content    text not null,
  is_pinned  boolean default false,
  created_at timestamptz default now()
);

-- 5. 소통의 장 게시글 ─────────────────────────────────────────────
create table posts (
  id          uuid default gen_random_uuid() primary key,
  nickname    text not null,
  content     text not null,
  is_secret   boolean default false,
  session_id  text not null,   -- 작성자 식별용 (수정/삭제)
  is_hidden   boolean default false,
  created_at  timestamptz default now()
);

-- 6. 관리자 답글 ──────────────────────────────────────────────────
create table post_replies (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid references posts(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- 7. 투표 ─────────────────────────────────────────────────────────
create table polls (
  id         uuid default gen_random_uuid() primary key,
  question   text not null,
  options    jsonb not null,   -- [{"text":"선택지1"},{"text":"선택지2"}]
  is_active  boolean default true,
  ends_at    timestamptz,
  created_at timestamptz default now()
);

-- 8. 투표 결과 ────────────────────────────────────────────────────
create table poll_votes (
  id           uuid default gen_random_uuid() primary key,
  poll_id      uuid references polls(id) on delete cascade,
  option_index int not null,
  session_id   text not null,
  created_at   timestamptz default now(),
  unique(poll_id, session_id)   -- 세션당 1회 투표
);

-- ================================================================
-- RLS (Row Level Security) 보안 정책
-- ================================================================

alter table menus          enable row level security;
alter table menu_likes     enable row level security;
alter table menu_requests  enable row level security;
alter table announcements  enable row level security;
alter table posts          enable row level security;
alter table post_replies   enable row level security;
alter table polls          enable row level security;
alter table poll_votes     enable row level security;

-- menus: 누구나 읽기 가능, 관리자만 쓰기
create policy "menus_read"   on menus for select using (true);
create policy "menus_admin"  on menus for all    using (auth.role() = 'authenticated');

-- menu_likes: 누구나 읽기/추가, 관리자만 삭제
create policy "likes_read"   on menu_likes for select using (true);
create policy "likes_insert" on menu_likes for insert with check (true);
create policy "likes_admin"  on menu_likes for delete using (auth.role() = 'authenticated');

-- menu_requests: 누구나 추가, 관리자만 읽기/수정
create policy "req_insert"  on menu_requests for insert with check (true);
create policy "req_admin"   on menu_requests for select using (auth.role() = 'authenticated');
create policy "req_update"  on menu_requests for update using (auth.role() = 'authenticated');

-- announcements: 누구나 읽기, 관리자만 쓰기
create policy "ann_read"    on announcements for select using (true);
create policy "ann_admin"   on announcements for all   using (auth.role() = 'authenticated');

-- posts: 공개글은 누구나 읽기, 비밀글은 관리자만 / 누구나 추가
create policy "posts_read_public" on posts for select
  using (is_secret = false and is_hidden = false);
create policy "posts_read_admin"  on posts for select
  using (auth.role() = 'authenticated');
create policy "posts_insert"      on posts for insert with check (true);
create policy "posts_admin"       on posts for update using (auth.role() = 'authenticated');

-- post_replies: 누구나 읽기, 관리자만 쓰기
create policy "replies_read"   on post_replies for select using (true);
create policy "replies_admin"  on post_replies for all   using (auth.role() = 'authenticated');

-- polls: 누구나 읽기, 관리자만 쓰기
create policy "polls_read"   on polls for select using (true);
create policy "polls_admin"  on polls for all   using (auth.role() = 'authenticated');

-- poll_votes: 누구나 읽기/추가
create policy "votes_read"   on poll_votes for select using (true);
create policy "votes_insert" on poll_votes for insert with check (true);

-- ================================================================
-- 샘플 데이터 (처음 세팅 후 삭제해도 됩니다)
-- ================================================================

insert into announcements (title, content, is_pinned) values
('요반 소통 공간 오픈! 🎉', '안녕하세요! 요리하는반찬가게 요반입니다.
드디어 고객님들과 직접 소통할 수 있는 공간이 생겼어요.
메뉴 미리보기, 요청, 피드백 모두 여기서 편하게 해주세요!', true);

insert into menus (date, name, category, display_order) values
(current_date, '제육볶음', '육류', 1),
(current_date, '시금치나물', '나물', 2),
(current_date, '깍두기', '김치', 3),
(current_date, '계란말이', '계란', 4),
(current_date, '콩나물무침', '나물', 5),
(current_date + 1, '닭갈비', '육류', 1),
(current_date + 1, '미역무침', '해조류', 2),
(current_date + 1, '배추김치', '김치', 3);
