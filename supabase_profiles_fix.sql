-- 1. Profiles 테이블 확인 및 생성 (없을 경우)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  username text,
  avatar_url text,
  introduction text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS (Row Level Security) 활성화
alter table public.profiles enable row level security;

-- 3. 정책(Policies) 설정 - 중복 생성 방지를 위해 기존 정책 삭제 후 생성 or if not exists 사용 불가하므로 drop 후 create
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 4. 새 유저 가입 시 자동으로 Profile을 생성하는 함수
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'name', 'User_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (id) do nothing; -- 이미 있으면 무시
  return new;
end;
$$;

-- 5. Trigger 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. [중요] 기존 유저 Backfill (현재 에러의 원인 해결)
-- profiles 테이블에 없는 auth.users 데이터를 찾아 넣어줍니다.
insert into public.profiles (id, username, avatar_url)
select 
  id, 
  COALESCE(raw_user_meta_data ->> 'username', raw_user_meta_data ->> 'name', 'User_' || substr(id::text, 1, 8)),
  COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture', '')
from auth.users
where id not in (select id from public.profiles);

-- 결과 확인용 (선택)
-- select * from public.profiles;
