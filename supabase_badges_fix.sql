-- 뱃지 기능을 위한 테이블 생성 스크립트
-- 이 스크립트를 수파베이스 SQL 에디터에서 실행해주세요.

-- 1. 뱃지 종류 테이블 (badges) 생성
create table if not exists public.badges (
  id text primary key,
  title text not null,
  description text,
  icon text,
  xp int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 사용자 뱃지 현황 테이블 (user_badges) 생성
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text references public.badges(id) on delete cascade not null,
  earned boolean default false,
  progress int default 0,
  goal int default 1,
  earned_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- 3. RLS (Row Level Security) 설정
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- 4. 정책(Policy) 생성
-- badges: 누구나 읽기 가능
create policy "Badges are viewable by everyone" on public.badges for select using (true);

-- user_badges: 자신의 뱃지만 관리, 읽기는 누구나(프로필 공개 시) 또는 자신만
-- 여기서는 일단 누구나 볼 수 있게 설정 (친구 프로필 등 고려)
create policy "User badges are viewable by everyone" on public.user_badges for select using (true);
create policy "Users can update own badges" on public.user_badges for insert with check (auth.uid() = user_id);
create policy "Users can update own badges data" on public.user_badges for update using (auth.uid() = user_id);

-- 5. 기본 뱃지 데이터 삽입 (mypageService.js에서 사용하는 ID들)
insert into public.badges (id, title, description, icon, xp) values
('first_europe', '설레는 첫 유럽', '첫 유럽 여행 일정을 생성했습니다.', '✈️', 100),
('photo_master', '사진 작가', '여행 사진을 50장 이상 업로드했습니다.', '📸', 300),
('pro_traveler', '프로 여행러', '10개 도시 이상의 여행 일정을 만들었습니다.', '🌍', 500),
('world_traveler', '세계 일주', '5개 대륙을 모두 여행했습니다.', '🗺️', 1000)
on conflict (id) do nothing;
