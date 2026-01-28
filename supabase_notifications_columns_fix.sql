-- ========================================
-- Notifications 테이블 컬럼 추가
-- ========================================

-- sender_id 컬럼 추가
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id);

-- link 컬럼 추가
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link text;

-- ✅ 완료!
