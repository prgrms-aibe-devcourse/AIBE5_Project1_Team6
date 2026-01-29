-- ========================================
-- Saved Places 테이블 생성 SQL
-- 사용자별 저장된 장소 관리
-- ========================================

-- 0. 기존 테이블이 있으면 삭제 (주의: 데이터 삭제됨)
DROP TABLE IF EXISTS saved_places CASCADE;

-- 1. saved_places 테이블 생성
CREATE TABLE saved_places (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  image text,
  country text default '대한민국',
  description text,
  tag text,
  category text, -- 'walk', 'traffic', 'airplane'
  match_score integer default 95,
  place_data jsonb, -- 전체 장소 데이터 저장 (좌표, API 데이터 등)
  created_at timestamp with time zone default now() not null
);

-- 2. RLS 활성화
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 자신의 저장된 장소만 조회 가능
CREATE POLICY "Users can view own saved places"
  ON saved_places FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 저장된 장소만 생성 가능
CREATE POLICY "Users can create own saved places"
  ON saved_places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 저장된 장소만 삭제 가능
CREATE POLICY "Users can delete own saved places"
  ON saved_places FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX saved_places_user_id_idx ON saved_places(user_id);
CREATE INDEX saved_places_category_idx ON saved_places(category);

-- ========================================
-- ✅ 완료!
-- ========================================
