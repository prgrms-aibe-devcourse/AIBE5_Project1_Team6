-- 댓글 수 자동 집계 트리거 함수
-- 이 스크립트를 수파베이스 SQL 에디터에서 실행해주세요.

-- 0. comment_count 컬럼이 없다면 추가
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'community_posts' and column_name = 'comment_count') then
        alter table public.community_posts add column comment_count integer default 0;
    end if;
end $$;

-- 1. 댓글 추가/삭제 시 comment_count를 업데이트하는 Trigger Function 생성
create or replace function public.handle_comment_count_update()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts
    set comment_count = (select count(*) from public.community_post_comments where post_id = new.post_id)
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts
    set comment_count = (select count(*) from public.community_post_comments where post_id = old.post_id)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- 2. 기존 트리거가 있다면 삭제 (충돌 방지)
drop trigger if exists on_comment_change on public.community_post_comments;

-- 3. 새로운 통합 트리거 생성 (INSERT, DELETE 모두 처리)
create trigger on_comment_change
  after insert or delete on public.community_post_comments
  for each row execute procedure public.handle_comment_count_update();

-- 4. 기존 데이터의 댓글 수 동기화 (한 번 실행)
update public.community_posts p
set comment_count = (select count(*) from public.community_post_comments c where c.post_id = p.id);
