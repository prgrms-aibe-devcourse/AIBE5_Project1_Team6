-- 후기 테이블 생성 (미디어 배열 지원)
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  author_name text not null,
  author_avatar text,
  destination text not null,
  rating int check (rating >= 1 and rating <= 5),
  content text not null,
  media jsonb default '[]'::jsonb, -- [{ url: string, type: 'image' | 'video' }]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 댓글 테이블 생성
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  author_name text not null,
  author_avatar text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 좋아요 테이블 생성 (사용자당 후기 하나에 한 번만 가능)
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(review_id, user_id)
);

-- RLS 활성화
alter table reviews enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- 후기 정책
create policy "누구나 후기 볼 수 있음" on reviews for select using (true);
create policy "인증된 사용자는 후기 작성 가능" on reviews for insert with check (auth.role() = 'authenticated');
create policy "작성자만 후기 수정 가능" on reviews for update using (auth.uid() = user_id);
create policy "작성자만 후기 삭제 가능" on reviews for delete using (auth.uid() = user_id);

-- 댓글 정책
create policy "누구나 댓글 볼 수 있음" on comments for select using (true);
create policy "인증된 사용자는 댓글 작성 가능" on comments for insert with check (auth.role() = 'authenticated');
create policy "작성자만 댓글 삭제 가능" on comments for delete using (auth.uid() = user_id);

-- 좋아요 정책
create policy "누구나 좋아요 볼 수 있음" on likes for select using (true);
create policy "인증된 사용자는 좋아요 가능" on likes for insert with check (auth.role() = 'authenticated');
create policy "자신의 좋아요 취소 가능" on likes for delete using (auth.uid() = user_id);
