-- 1. 후기 테이블 (reviews)
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,                -- 제목 
  body text,                         -- 본문 
  mood text,                         -- 여행 무드 (romantic, refresh 등)
  theme text,                        -- 여행 테마 (healing, food 등)
  created_at timestamp with time zone default now() not null,
  rating smallint default 5 not null, -- 별점 (기본값 5)
  media text[] default array[]::text[], -- 미디어 URL 배열
  like_count integer default 0 not null,
  comment_count integer default 0 not null
);

-- 2. 댓글 테이블 (review_comments)
create table if not exists review_comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  parent_comment_id uuid references review_comments(id) on delete cascade, -- 답글 
  body text not null,                -- 댓글 내용 
  is_deleted boolean default false not null,
  created_at timestamp with time zone default now() not null
);

-- 3. 좋아요 테이블 (review_likes)
create table if not exists review_likes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default now() not null,
  unique(review_id, user_id)
);

-- RLS 활성화
alter table reviews enable row level security;
alter table review_comments enable row level security;
alter table review_likes enable row level security;

-- 후기 정책
create policy "누구나 후기 볼 수 있음" on reviews for select using (true);
create policy "인증된 사용자는 후기 작성 가능" on reviews for insert with check (auth.role() = 'authenticated');
create policy "작성자만 후기 수정 가능" on reviews for update using (auth.uid() = user_id);
create policy "작성자만 후기 삭제 가능" on reviews for delete using (auth.uid() = user_id);

-- 댓글 정책
create policy "누구나 댓글 볼 수 있음" on review_comments for select using (true);
create policy "인증된 사용자는 댓글 작성 가능" on review_comments for insert with check (auth.role() = 'authenticated');
create policy "작성자만 댓글 삭제 가능" on review_comments for delete using (auth.uid() = user_id);

-- 좋아요 정책
create policy "누구나 좋아요 볼 수 있음" on review_likes for select using (true);
create policy "인증된 사용자는 좋아요 가능" on review_likes for insert with check (auth.role() = 'authenticated');
create policy "자신의 좋아요 취소 가능" on review_likes for delete using (auth.uid() = user_id);
