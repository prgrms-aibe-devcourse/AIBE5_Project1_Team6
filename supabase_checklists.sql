-- ========================================
-- Travel Checklists 테이블 생성 SQL
-- 사용자별/일정별 체크리스트 상태 저장
-- ========================================

-- 1. 체크리스트 테이블 생성
create table if not exists travel_checklists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  schedule_id uuid references schedules(id) on delete cascade,
  checklist_data jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 2. RLS 활성화
alter table travel_checklists enable row level security;

-- 3. RLS 정책 생성
-- 사용자는 자신의 체크리스트만 조회 가능
create policy "Users can view own checklists"
  on travel_checklists for select
  using (auth.uid() = user_id);

-- 사용자는 자신의 체크리스트만 생성 가능
create policy "Users can create own checklists"
  on travel_checklists for insert
  with check (auth.uid() = user_id);

-- 사용자는 자신의 체크리스트만 수정 가능
create policy "Users can update own checklists"
  on travel_checklists for update
  using (auth.uid() = user_id);

-- 사용자는 자신의 체크리스트만 삭제 가능
create policy "Users can delete own checklists"
  on travel_checklists for delete
  using (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트 트리거
create trigger update_travel_checklists_updated_at
  before update on travel_checklists
  for each row
  execute function update_updated_at_column();

-- 5. 인덱스 생성 (성능 최적화)
create index if not exists travel_checklists_user_id_idx on travel_checklists(user_id);
create index if not exists travel_checklists_schedule_id_idx on travel_checklists(schedule_id);

-- ========================================
-- ✅ 완료!
-- Supabase SQL Editor에서 이 스크립트를 실행하세요.
-- ========================================
