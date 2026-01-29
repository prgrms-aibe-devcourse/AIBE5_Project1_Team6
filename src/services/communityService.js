import { supabase } from './supabase';
import { createNotification } from './mypageService';

export const communityService = {
    // 이미지 업로드
    async uploadImage(file) {
        try {
            if (!file) return null;
            
            // 파일명 생성 (unique)
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Supabase Storage에 업로드
            const { data, error } = await supabase.storage
                .from('community_images')
                .upload(filePath, file);

            if (error) {
                console.error('Upload image error:', error);
                // 버킷이 없을 경우를 대비한 에러 처리 필요할 수 있음
                throw error;
            }

            // Public URL 가져오기
            const { data: { publicUrl } } = supabase.storage
                .from('community_images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('uploadImage exception:', error);
            return null;
        }
    },

    // 게시글 목록 가져오기 (카테고리별)
    async getPosts(category, sort = 'latest', search = { type: '', keyword: '' }, wellnessOptions = { mood: null, themes: [] }, currentUserId = null, filterUserId = null) {
        try {
            // profiles 테이블과 join하여 작성자 정보 가져오기
            let query = supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id!inner (
                        username,
                        avatar_url
                    )
                `)
                .eq('category', category);

            // 특정 유저의 글만 필터링 (MyPage용)
            if (filterUserId) {
                query = query.eq('user_id', filterUserId);
            }

            // 검색 필터
            if (search.keyword) {
                const term = `%${search.keyword}%`;
                if (search.type === 'author') {
                    // 작성자 검색
                    query = query.ilike('profiles.username', term);
                } else if (search.type === 'destination') {
                    query = query.ilike('destination', term);
                } else if (search.type === 'title') {
                    query = query.ilike('title', term);
                } else if (search.type === 'body') {
                    query = query.or(`title.ilike.${term},body.ilike.${term}`);
                } else {
                    query = query.or(`title.ilike.${term},body.ilike.${term}`);
                }
            }

            // 여행 후기 전용 필터 (wellness)
            if (category === 'review') {
                if (wellnessOptions.mood) {
                    query = query.eq('mood', wellnessOptions.mood);
                }
                if (wellnessOptions.themes && wellnessOptions.themes.length > 0) {
                    query = query.eq('theme', wellnessOptions.themes[0]);
                }
            }

            // 정렬
            if (sort === 'likes') {
                query = query.order('like_count', { ascending: false });
            } else if (sort === 'views') {
                query = query.order('view_count', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data: posts, error: postError } = await query;

            if (postError) {
                console.error('getPosts error:', postError);
                return { data: [], error: postError };
            }

            if (!posts || posts.length === 0) {
                return { data: [], error: null };
            }

            // 좋아요 여부 확인
            let userLikedIds = new Set();
            if (currentUserId) {
                const { data: likes } = await supabase
                    .from('community_post_likes')
                    .select('post_id')
                    .eq('user_id', currentUserId);

                if (likes) {
                    likes.forEach(like => userLikedIds.add(like.post_id));
                }
            }

            // UI 호환성을 위한 데이터 매핑
            const processed = posts.map(post => ({
                ...post,
                // 프로필 정보 매핑
                author_name: post.profiles?.username || '익명',
                author_avatar: post.profiles?.avatar_url || '',
                // review UI 호환 - destination은 DB 컬럼 사용, 없으면 title fallback
                destination: post.destination || post.title,
                content: post.body,
                themes: post.theme ? [post.theme] : [],
                // 상태
                is_liked: userLikedIds.has(post.id),
                likes: post.like_count || 0,
                comments: post.comment_count || 0,
                views: post.view_count || 0
            }));

            return { data: processed, error: null };
        } catch (error) {
            console.error('getPosts exception:', error);
            return { data: [], error };
        }
    },

    // 단일 게시글 가져오기
    async getPost(postId, currentUserId = null) {
        try {
            const { data: post, error } = await supabase
                .from('community_posts')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('id', postId)
                .single();

            if (error) {
                console.error('getPost error:', error);
                return { data: null, error };
            }

            // 좋아요 여부 확인
            let isLiked = false;
            if (currentUserId) {
                const { data: like } = await supabase
                    .from('community_post_likes')
                    .select('id')
                    .eq('post_id', postId)
                    .eq('user_id', currentUserId)
                    .single();
                isLiked = !!like;
            }

            const processed = {
                ...post,
                author_name: post.profiles?.username || '익명',
                author_avatar: post.profiles?.avatar_url || '',
                destination: post.destination || post.title,
                content: post.body,
                themes: post.theme ? [post.theme] : [],
                is_liked: isLiked,
                likes: post.like_count || 0,
                comments: post.comment_count || 0,
                views: post.view_count || 0
            };

            return { data: processed, error: null };
        } catch (error) {
            console.error('getPost exception:', error);
            return { data: null, error };
        }
    },

    // 게시글 생성
    async createPost(postData) {
        try {
            // base64 데이터는 너무 커서 DB에 저장 불가 - URL만 필터링
            const mediaUrls = (postData.media || [])
                .map(m => typeof m === 'string' ? m : m.url)
                .filter(url => url && !url.startsWith('data:')); // base64 제외

            const dbData = {
                user_id: postData.user_id,
                category: postData.category,
                title: postData.title,
                body: postData.body || postData.content,
                destination: postData.category === 'review' ? (postData.destination || null) : null,
                mood: postData.mood || null,
                theme: postData.themes?.[0] || postData.theme || null,
                rating: postData.category === 'review' ? (postData.rating || 5) : null,
                media: mediaUrls
            };

            console.log('Creating post with data:', dbData);

            const { data, error } = await supabase
                .from('community_posts')
                .insert([dbData])
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .single();

            if (error) {
                console.error('createPost error:', error);
                return { data: null, error };
            }

            // UI 호환성 매핑
            const processed = {
                ...data,
                author_name: data.profiles?.username || '익명',
                author_avatar: data.profiles?.avatar_url || '',
                destination: data.destination || data.title,
                content: data.body,
                themes: data.theme ? [data.theme] : [],
                is_liked: false,
                likes: 0,
                comments: 0,
                views: 0
            };

            // Trigger Notification for Self (Testing purpose) - Fixed await and error handling
            try {
                 await createNotification({
                    user_id: postData.user_id, // Use the user_id from arguments
                    sender_id: postData.user_id, // Sender is self
                    type: 'post',
                    message: `새로운 글 "${postData.title}"을(를) 작성하였습니다.`,
                    link: '/mypage?tab=reviews' 
                });
            } catch (notiError) {
                console.error("Notification trigger failed:", notiError);
            }

            return { data: processed, error: null };
        } catch (error) {
            console.error('createPost exception:', error);
            return { data: null, error };
        }
    },

    // 게시글 수정
    async updatePost(id, updates) {
        try {
            const dbUpdates = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.body || updates.content) dbUpdates.body = updates.body || updates.content;
            if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
            if (updates.theme !== undefined || updates.themes !== undefined) {
                dbUpdates.theme = Array.isArray(updates.themes) ? updates.themes[0] : (updates.theme || null);
            }

            if (updates.category === 'review') {
                if (updates.destination !== undefined) dbUpdates.destination = updates.destination;
                if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
            } else if (updates.category === 'free') {
                dbUpdates.destination = null;
                dbUpdates.rating = null;
            } else {
                if (updates.destination !== undefined) dbUpdates.destination = updates.destination;
                if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
            }
            if (updates.media) dbUpdates.media = updates.media.map(m => typeof m === 'string' ? m : m.url);

            const { data, error } = await supabase
                .from('community_posts')
                .update(dbUpdates)
                .eq('id', id)
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .single();

            if (error) {
                console.error('updatePost error:', error);
                return { data: null, error };
            }

            const processed = {
                ...data,
                author_name: data.profiles?.username || '익명',
                author_avatar: data.profiles?.avatar_url || '',
                destination: data.destination || data.title,
                content: data.body,
                themes: data.theme ? [data.theme] : []
            };

            return { data: processed, error: null };
        } catch (error) {
            console.error('updatePost exception:', error);
            return { data: null, error };
        }
    },

    // 게시글 삭제
    async deletePost(id) {
        try {
            const { error } = await supabase
                .from('community_posts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('deletePost error:', error);
            }
            return { error };
        } catch (error) {
            console.error('deletePost exception:', error);
            return { error };
        }
    },

    // 조회수 증가
    async incrementViewCount(id) {
        try {
            // RPC 함수 사용 (동시성 안전)
            const { error } = await supabase.rpc('increment_view_count', { post_id: id });

            if (error) {
                console.error('incrementViewCount error:', error);
            }
        } catch (error) {
            console.error('incrementViewCount exception:', error);
        }
    },

    // 좋아요 토글
    async toggleLike(postId, userId) {
        try {
            // 기존 좋아요 확인
            const { data: existingLike } = await supabase
                .from('community_post_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', userId)
                .maybeSingle();

            if (existingLike) {
                // 좋아요 취소
                const { error } = await supabase
                    .from('community_post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userId);
                return { liked: false, error };
            } else {
                // 좋아요 추가
                const { error } = await supabase
                    .from('community_post_likes')
                    .insert([{ post_id: postId, user_id: userId }]);

                // 알림 생성
                if (!error) {
                    // 게시글 작성자 정보 가져오기
                    const { data: postData } = await supabase
                        .from('community_posts')
                        .select('user_id, title')
                        .eq('id', postId)
                        .single();

                    if (postData && postData.user_id !== userId) {
                        await createNotification({
                            user_id: postData.user_id, // 수신자: 게시글 작성자
                            sender_id: userId,        // 발신자: 좋아요 누른 사람
                            type: 'like',
                            message: `님이 회원님의 게시글 "${postData.title}"을 좋아합니다.`,
                            link: `/community/${postId}` // (선택) 이동 링크
                        });
                    }
                }
                return { liked: true, error };
            }
        } catch (error) {
            console.error('toggleLike exception:', error);
            return { error };
        }
    },

    // 댓글 가져오기
    async getComments(postId) {
        try {
            const { data, error } = await supabase
                .from('community_post_comments')
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('getComments error:', error);
                return { data: [], error };
            }

            // UI 호환성 매핑
            const processed = (data || []).map(c => ({
                ...c,
                author_name: c.profiles?.username || '익명',
                author_avatar: c.profiles?.avatar_url || '',
                content: c.body // UI에서 content 필드 사용
            }));

            return { data: processed, error: null };
        } catch (error) {
            console.error('getComments exception:', error);
            return { data: [], error };
        }
    },

    // 댓글 작성
    async addComment(postId, commentData) {
        try {
            const dbData = {
                post_id: postId,
                user_id: commentData.user_id,
                body: commentData.content || commentData.body,
                parent_id: commentData.parent_id || null // 답글인 경우 부모 댓글 ID
            };

            const { data, error } = await supabase
                .from('community_post_comments')
                .insert([dbData])
                .select(`
                    *,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .single();

            if (error) {
                console.error('addComment error:', error);
                return { data: null, error };
            }

            const processed = {
                ...data,
                author_name: data.profiles?.username || '익명',
                author_avatar: data.profiles?.avatar_url || '',
                content: data.body
            };

            // 알림 생성
            // 게시글 작성자 정보 가져오기
            const { data: postData } = await supabase
                .from('community_posts')
                .select('user_id, title')
                .eq('id', postId)
                .single();

            if (postData && postData.user_id !== commentData.user_id) {
                 await createNotification({
                    user_id: postData.user_id,
                    sender_id: commentData.user_id,
                    type: 'comment',
                    message: `님이 회원님의 게시글 "${postData.title}"에 댓글을 남겼습니다.`,
                    link: `/community/${postId}`
                });
            }

            return { data: processed, error: null };
        } catch (error) {
            console.error('addComment exception:', error);
            return { data: null, error };
        }
    },

    // 댓글 삭제 (답글 포함)
    async deleteComment(postId, commentId) {
        try {
            // 1. 해당 댓글을 부모로 하는 답글들(replies)을 먼저 삭제
            const { error: replyError } = await supabase
                .from('community_post_comments')
                .delete()
                .eq('parent_id', commentId);

            if (replyError) {
                console.error('delete replies error:', replyError);
                // 답글 삭제 중 에러가 나도 메인 댓글 삭제 시도 (DB 제약 조건에 따라 실패할 수 있음)
            }

            // 2. 메인 댓글 삭제
            const { error } = await supabase
                .from('community_post_comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                console.error('deleteComment error:', error);
            }
            return { error };
        } catch (error) {
            console.error('deleteComment exception:', error);
            return { error };
        }
    }
};
