-- Notifications 테이블 생성
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'schedule')),
    message TEXT NOT NULL,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    schedule_id UUID,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (기존 정책이 있으면 삭제 후 재생성)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create notifications" ON notifications;
CREATE POLICY "Anyone can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- 5. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 좋아요 수 증가/감소 함수 및 트리거
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS increment_post_like_count ON community_post_likes;
CREATE TRIGGER increment_post_like_count
    AFTER INSERT ON community_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_like_count();

DROP TRIGGER IF EXISTS decrement_post_like_count ON community_post_likes;
CREATE TRIGGER decrement_post_like_count
    AFTER DELETE ON community_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_like_count();

-- 7. 댓글 수 증가/감소 함수 및 트리거
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS increment_post_comment_count ON community_post_comments;
CREATE TRIGGER increment_post_comment_count
    AFTER INSERT ON community_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS decrement_post_comment_count ON community_post_comments;
CREATE TRIGGER decrement_post_comment_count
    AFTER DELETE ON community_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION decrement_comment_count();

-- 8. community_posts 테이블에 필요한 컬럼 추가 (없는 경우에만)
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 9. 기존 데이터의 카운트 초기화 (선택사항)
-- 이미 있는 좋아요/댓글 수를 정확하게 계산하여 업데이트
UPDATE community_posts
SET like_count = (
    SELECT COUNT(*) 
    FROM community_post_likes 
    WHERE community_post_likes.post_id = community_posts.id
),
comment_count = (
    SELECT COUNT(*) 
    FROM community_post_comments 
    WHERE community_post_comments.post_id = community_posts.id
);
