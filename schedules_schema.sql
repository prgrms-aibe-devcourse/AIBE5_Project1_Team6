-- ========================================
-- Schedules 테이블 완전 생성 SQL
-- 처음부터 새로 만들 때 사용
-- ========================================

-- 1. 일정 테이블 (schedules) 생성
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  start_date date,
  end_date date,
  people smallint default 1 not null,
  schedule_text text,
  weather_info jsonb,
  mood_data jsonb,
  accommodations jsonb default '[]'::jsonb,
  restaurants jsonb default '[]'::jsonb,
  is_public boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 2. RLS 활성화
alter table schedules enable row level security;

-- 3. RLS 정책 생성

-- 누구나 공개 일정을 볼 수 있음
create policy "누구나 공개 일정 볼 수 있음" 
  on schedules for select 
  using (is_public = true);

-- 작성자는 자신의 모든 일정(공개/비공개)을 볼 수 있음
create policy "작성자는 자신의 일정 볼 수 있음" 
  on schedules for select 
  using (auth.uid() = user_id);

-- 인증된 사용자는 일정 작성 가능
create policy "인증된 사용자는 일정 작성 가능" 
  on schedules for insert 
  with check (auth.role() = 'authenticated');

-- 작성자만 일정 수정 가능
create policy "작성자만 일정 수정 가능" 
  on schedules for update 
  using (auth.uid() = user_id);

-- 작성자만 일정 삭제 가능
create policy "작성자만 일정 삭제 가능" 
  on schedules for delete 
  using (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트 트리거
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_schedules_updated_at
  before update on schedules
  for each row
  execute function update_updated_at_column();

-- 5. 인덱스 생성 (성능 최적화)
create index if not exists schedules_user_id_idx on schedules(user_id);
create index if not exists schedules_created_at_idx on schedules(created_at desc);
create index if not exists schedules_is_public_idx on schedules(is_public);

-- ========================================
-- ✅ 완료! 
-- schedules 테이블과 모든 정책이 생성되었습니다.
-- ========================================
