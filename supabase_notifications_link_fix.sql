-- ========================================
-- Notifications 테이블에 link 컬럼 추가
-- ========================================

-- link 컬럼 추가 (이미 있으면 무시)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link text;

-- ✅ 완료!
