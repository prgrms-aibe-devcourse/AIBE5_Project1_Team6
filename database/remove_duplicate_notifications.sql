-- 중복 알림 삭제 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 중복된 알림 확인 (실행 전 확인용)
SELECT 
    user_id,
    type,
    schedule_id,
    message,
    COUNT(*) as count
FROM notifications
WHERE type = 'schedule'
GROUP BY user_id, type, schedule_id, message
HAVING COUNT(*) > 1;

-- 2. 중복 알림 삭제 (가장 최근 것만 남기고 나머지 삭제)
DELETE FROM notifications
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, type, schedule_id, message 
                ORDER BY created_at DESC
            ) as rn
        FROM notifications
        WHERE type = 'schedule'
    ) t
    WHERE rn > 1
);

-- 3. 좋아요/댓글 알림 중복도 확인 및 삭제
DELETE FROM notifications
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, type, post_id, actor_id 
                ORDER BY created_at DESC
            ) as rn
        FROM notifications
        WHERE type IN ('like', 'comment')
    ) t
    WHERE rn > 1
);

-- 4. 삭제 후 확인
SELECT 
    type,
    COUNT(*) as total_notifications
FROM notifications
GROUP BY type
ORDER BY type;
