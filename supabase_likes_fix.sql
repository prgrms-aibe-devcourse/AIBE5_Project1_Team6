-- 좋아요 수 자동 집계 트리거 함수
-- 이 스크립트를 수파베이스 SQL 에디터에서 실행해주세요.

-- 1. 좋아요 추가/삭제 시 like_count를 업데이트하는 Trigger Function 생성
create or replace function public.handle_like_count_update()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.community_posts
    set like_count = (select count(*) from public.community_post_likes where post_id = new.post_id)
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.community_posts
    set like_count = (select count(*) from public.community_post_likes where post_id = old.post_id)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- 2. 기존 트리거가 있다면 삭제 (충돌 방지)
drop trigger if exists on_like_change on public.community_post_likes;
drop trigger if exists on_like_added on public.community_post_likes;
drop trigger if exists on_like_removed on public.community_post_likes;

-- 3. 새로운 통합 트리거 생성 (INSERT, DELETE 모두 처리)
create trigger on_like_change
  after insert or delete on public.community_post_likes
  for each row execute procedure public.handle_like_count_update();

-- 4. (선택사항) 기존 데이터의 좋아요 수 동기화 (한 번 실행)
-- update public.community_posts p
-- set like_count = (select count(*) from public.community_post_likes l where l.post_id = p.id);
