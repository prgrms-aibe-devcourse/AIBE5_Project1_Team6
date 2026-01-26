-- ========================================
-- Schedules 테이블 완전 마이그레이션 SQL
-- weather_info, mood_data, accommodations, restaurants 포함 전체 버전
-- 한 번에 실행 가능 ✅
-- ========================================

-- 1. weather_info 컬럼 추가 (없으면)
alter table schedules 
add column if not exists weather_info jsonb;

-- 2. mood_data 컬럼 추가 (없으면)
alter table schedules 
add column if not exists mood_data jsonb;

-- 3. accommodations 컬럼 추가
alter table schedules 
add column if not exists accommodations jsonb default '[]'::jsonb;

-- 4. restaurants 컬럼 추가
alter table schedules 
add column if not exists restaurants jsonb default '[]'::jsonb;

-- 5. people 컬럼 타입 변경 (데이터 보존)
-- 만약 people이 없다면 추가
alter table schedules 
add column if not exists people smallint default 1 not null;

-- 이미 있다면 타입만 변경
alter table schedules 
alter column people type smallint using people::smallint;

-- 6. jsonb 컬럼들의 NOT NULL 제약조건 제거
alter table schedules 
alter column weather_info drop not null;

alter table schedules 
alter column mood_data drop not null;

alter table schedules 
alter column accommodations drop not null;

alter table schedules 
alter column restaurants drop not null;

-- 7. 기존 행들의 null 값을 빈 배열로 업데이트
update schedules 
set accommodations = '[]'::jsonb 
where accommodations is null;

update schedules 
set restaurants = '[]'::jsonb 
where restaurants is null;

-- ========================================
-- ✅ 완료! 
-- weather_info, mood_data 포함 모든 컬럼 준비됨
-- ========================================
