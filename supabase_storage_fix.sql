-- 1. community_images 버킷 생성 (이미 존재하면 무시)
insert into storage.buckets (id, name, public)
values ('community_images', 'community_images', true)
on conflict (id) do nothing;

-- 2. 정책(Policy) 설정 (Storage는 storage.objects 테이블을 사용합니다)

-- 2-1. 누구나 이미지 보기 (Select) 허용
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'community_images' );

-- 2-2. 로그인한 유저만 이미지 업로드 (Insert) 허용
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'community_images'
  and auth.role() = 'authenticated'
);

-- 2-3. 자기 이미지 수정/삭제 (Update/Delete) 허용 (선택사항)
drop policy if exists "Owner Maintain" on storage.objects;
create policy "Owner Maintain"
on storage.objects for all
using (
  bucket_id = 'community_images' 
  and auth.uid() = owner
);
