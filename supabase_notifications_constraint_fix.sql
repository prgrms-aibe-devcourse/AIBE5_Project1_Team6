-- ===============================================
-- Notifications 테이블의 type 제약 조건 수정
-- ===============================================

-- 1. 기존 제약 조건 삭제 (이름은 보통 notifications_type_check)
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. 새로운 제약 조건 추가 ('save' 포함)
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('like', 'comment', 'save', 'schedule', 'post', 'badge', 'system', 'friend'));

-- ✅ 완료!
