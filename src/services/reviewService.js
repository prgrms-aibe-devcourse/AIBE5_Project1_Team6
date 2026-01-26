import { supabase } from './supabase';

export const reviewService = {
    // 후기 목록 가져오기
    async getReviews(sort = 'latest', search = { type: '', keyword: '' }, wellnessOptions = { mood: null, themes: [] }, currentUserId = null) {
        try {
            // 기본 쿼리: 후기와 함께 현재 사용자의 좋아요 여부 확인
            let query = supabase.from('reviews').select(`
                *,
                user_liked:review_likes(count).eq(user_id, ${currentUserId ? `'${currentUserId}'` : 'null'})
            `);

            // 검색 필터
            if (search.keyword) {
                const term = `%${search.keyword}%`;
                if (search.type === 'destination') {
                    // DB 컬럼이 title로 바뀌었으므로 title에서 검색
                    query = query.ilike('title', term);
                } else if (search.type === 'author') {
                    // author_name 컬럼이 실제 DB에는 없을 수 있음 (스크린샷에 안보임)
                    // 하지만 UI에서 필요하므로 일단 titles/body에서 검색 유도하거나 
                    // user_id 기반 조인이 필요할 수 있음. 우선은 title/body 검색만 지원.
                    query = query.or(`title.ilike.${term},body.ilike.${term}`);
                } else if (search.type === 'content') {
                    query = query.ilike('body', term);
                } else {
                    query = query.or(`title.ilike.${term},body.ilike.${term}`);
                }
            }

            // 웰니스 필터
            if (wellnessOptions.mood) {
                query = query.eq('mood', wellnessOptions.mood);
            }
            if (wellnessOptions.themes && wellnessOptions.themes.length > 0) {
                // DB의 theme 컬럼이 단일 text이므로 첫 번째 테마만 매칭 (또는 전체 매칭 시도)
                query = query.eq('theme', wellnessOptions.themes[0]);
            }

            // 정렬
            if (sort === 'likes') {
                query = query.order('like_count', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;
            if (error) throw error;

            // 데이터 가공 (is_liked 여부 추출 및 필드 매핑)
            const processed = data.map(review => ({
                ...review,
                destination: review.title, // UI 지원
                content: review.body,      // UI 지원
                themes: review.theme ? [review.theme] : [], // UI 지원 (배열로 변환)
                is_liked: (review.user_liked?.[0]?.count || 0) > 0,
                likes: review.like_count || 0,
                comments: review.comment_count || 0
            }));

            return { data: processed, error: null };
        } catch (error) {
            console.error('getReviews error:', error);
            return { data: [], error };
        }
    },

    // 후기 작성
    async createReview(reviewData) {
        const dbData = {
            user_id: reviewData.user_id,
            title: reviewData.destination,
            body: reviewData.content,
            mood: reviewData.mood,
            theme: reviewData.themes?.[0] || null, // 하나만 저장
            rating: reviewData.rating,
            media: reviewData.media?.map(m => typeof m === 'string' ? m : m.url) || [] // URL만 추출
        };

        const { data, error } = await supabase
            .from('reviews')
            .insert([dbData])
            .select()
            .single();
        return { data, error };
    },

    // 후기 수정
    async updateReview(id, updates) {
        const dbUpdates = {};
        if (updates.destination) dbUpdates.title = updates.destination;
        if (updates.content) dbUpdates.body = updates.content;
        if (updates.mood) dbUpdates.mood = updates.mood;
        if (updates.themes) dbUpdates.theme = updates.themes[0];
        if (updates.rating) dbUpdates.rating = updates.rating;
        if (updates.media) dbUpdates.media = updates.media.map(m => typeof m === 'string' ? m : m.url);

        const { data, error } = await supabase
            .from('reviews')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // 후기 삭제
    async deleteReview(id) {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);
        return { error };
    },

    // 좋아요 토글
    async toggleLike(reviewId, userId) {
        try {
            // 먼저 이미 좋아요를 눌렀는지 확인
            const { data: existingLike } = await supabase
                .from('review_likes')
                .select('id')
                .eq('review_id', reviewId)
                .eq('user_id', userId)
                .single();

            if (existingLike) {
                // 좋아요 취소
                const { error } = await supabase
                    .from('review_likes')
                    .delete()
                    .eq('review_id', reviewId)
                    .eq('user_id', userId);
                return { error };
            } else {
                // 좋아요 추가
                const { error } = await supabase
                    .from('review_likes')
                    .insert([{ review_id: reviewId, user_id: userId }]);
                return { error };
            }
        } catch (error) {
            return { error };
        }
    },

    // 댓글 가져오기
    async getComments(reviewId) {
        const { data, error } = await supabase
            .from('review_comments')
            .select('*')
            .eq('review_id', reviewId)
            .order('created_at', { ascending: true });

        // UI 호환성을 위해 필드 매핑
        const processed = data?.map(c => ({
            ...c,
            content: c.body,
            parent_id: c.parent_comment_id
        })) || [];

        return { data: processed, error };
    },

    // 댓글 작성
    async addComment(reviewId, commentData) {
        // DB 필드에 맞게 매핑 (parent_id -> parent_comment_id, content -> body)
        const dbData = {
            review_id: reviewId,
            user_id: commentData.user_id,
            parent_comment_id: commentData.parent_id,
            body: commentData.content,
            // author_name, author_avatar는 스크린샷에 없으므로 일단 제외하거나 
            // DB에 있다면 포함되도록 스프레드 사용 (현재 스크린샷 기준으로는 제외가 맞을듯)
        };

        const { data, error } = await supabase
            .from('review_comments')
            .insert([dbData])
            .select()
            .single();

        if (data) {
            data.content = data.body;
            data.parent_id = data.parent_comment_id;
        }

        return { data, error };
    },

    // 댓글 삭제
    async deleteComment(reviewId, commentId) {
        // RLS로 본인만 삭제 가능하도록 설정되어 있음
        const { error } = await supabase
            .from('review_comments')
            .delete()
            .eq('id', commentId);
        return { error };
    }
};
