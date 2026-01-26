import { supabase } from './supabase';

// 예시 데이터 3개
const MOCK_REVIEWS = [
    {
        id: '1',
        user_id: 'mock-user-1',
        author_name: '여행자1',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        destination: '제주도',
        rating: 5,
        content: '제주도 푸른 밤, 정말 아름다웠어요. 성산일출봉에서 본 일출은 잊을 수 없습니다. 맛집 투어도 최고!',
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=600&auto=format&fit=crop' },
            { type: 'image', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop' }
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2일 전
        likes: 12,
        comments: 3,
        is_liked: false,
        mood: 'burnout',
        themes: ['healing']
    },
    {
        id: '2',
        user_id: 'mock-user-2',
        author_name: '구름이',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        destination: '부산',
        rating: 4,
        content: '부산 해운대와 광안리, 야경이 정말 멋집니다. 다만 사람이 너무 많아서 조금 힘들었어요. 그래도 국밥은 진리!',
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=600&auto=format&fit=crop' }
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5시간 전
        likes: 45,
        comments: 8,
        is_liked: true,
        mood: 'refresh',
        themes: ['food']
    },
    {
        id: '3',
        user_id: 'mock-user-3',
        author_name: '산타고',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        destination: '설악산',
        rating: 5,
        content: '가을 단풍 구경하러 설악산에 다녀왔습니다. 케이블카 타고 올라가니 정말 편하고 경치도 끝내줬어요.',
        media: [
            { type: 'image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop' },
            { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
        likes: 5,
        comments: 0,
        is_liked: false,
        mood: 'active',
        themes: ['activity']
    }
];

// 예시 댓글 데이터
const MOCK_COMMENTS = {
    '1': [
        { id: 'c1', user_id: 'u1', author_name: '댓글러1', content: '정말 멋지네요!', created_at: new Date().toISOString(), parent_id: null },
        { id: 'c2', user_id: 'u2', author_name: '댓글러2', content: '정보 감사합니다.', created_at: new Date().toISOString(), parent_id: null }
    ],
    '2': [
        { id: 'c3', user_id: 'u3', author_name: '부산사람', content: '부산은 사랑이죠.', created_at: new Date().toISOString(), parent_id: null }
    ]
};

// 로컬 상태로 목업 데이터 관리 (실제 DB 연동 전까지)
let localReviews = [...MOCK_REVIEWS];
let localComments = { ...MOCK_COMMENTS };

export const reviewService = {
    // 후기 목록 가져오기
    async getReviews(sort = 'latest', search = { type: '', keyword: '' }, wellnessOptions = { mood: null, themes: [] }) {
        // 실제 Supabase 연동 시 아래 코드를 활성화
        // let query = supabase.from('reviews').select(`
        //   *,
        //   comments (count),
        //   likes (count)
        // `);

        // 목업 데이터 필터링 및 정렬
        let filtered = [...localReviews];

        // 검색 필터
        if (search.keyword) {
            const lowerKeyword = search.keyword.toLowerCase();
            filtered = filtered.filter(review => {
                if (search.type === 'destination') return review.destination.toLowerCase().includes(lowerKeyword);
                if (search.type === 'author') return review.author_name.toLowerCase().includes(lowerKeyword);
                if (search.type === 'content') return review.content.toLowerCase().includes(lowerKeyword);

                // 전체 검색
                return (
                    review.destination.toLowerCase().includes(lowerKeyword) ||
                    review.author_name.toLowerCase().includes(lowerKeyword) ||
                    review.content.toLowerCase().includes(lowerKeyword)
                );
            });
        }

        // 웰니스 필터 (사용자가 명시적으로 필터를 걸었을 때)
        if (wellnessOptions.mood || (wellnessOptions.themes && wellnessOptions.themes.length > 0)) {
            filtered = filtered.filter(review => {
                let match = true;
                if (wellnessOptions.mood && review.mood !== wellnessOptions.mood) match = false;
                if (wellnessOptions.themes && wellnessOptions.themes.length > 0) {
                    const hasTheme = wellnessOptions.themes.some(t => review.themes?.includes(t));
                    if (!hasTheme) match = false;
                }
                return match;
            });
        }

        // 정렬 및 가중치 부여 (추천)
        filtered.sort((a, b) => {
            // 웰니스 일치 가중치 부여 (사용자 취향 일치 시 상단 노출)
            if (wellnessOptions.mood || (wellnessOptions.themes && wellnessOptions.themes.length > 0)) {
                let scoreA = 0;
                let scoreB = 0;

                if (wellnessOptions.mood) {
                    if (a.mood === wellnessOptions.mood) scoreA += 10;
                    if (b.mood === wellnessOptions.mood) scoreB += 10;
                }

                if (wellnessOptions.themes && wellnessOptions.themes.length > 0) {
                    wellnessOptions.themes.forEach(t => {
                        if (a.themes?.includes(t)) scoreA += 5;
                        if (b.themes?.includes(t)) scoreB += 5;
                    });
                }

                if (scoreA !== scoreB) return scoreB - scoreA;
            }

            if (sort === 'likes') {
                return b.likes - a.likes;
            } else {
                // 최신순 (기본값)
                return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        return { data: filtered, error: null };
    },

    // 후기 작성
    async createReview(reviewData) {
        // 목업: 로컬 배열에 추가
        const newReview = {
            id: String(Date.now()),
            ...reviewData,
            likes: 0,
            comments: 0,
            is_liked: false,
            created_at: new Date().toISOString()
        };
        localReviews = [newReview, ...localReviews];
        return { data: newReview, error: null };

        // 실제 Supabase:
        // const { data, error } = await supabase.from('reviews').insert(reviewData).select().single();
        // return { data, error };
    },

    // 후기 수정
    async updateReview(id, updates) {
        // 목업 업데이트
        localReviews = localReviews.map(r => r.id === id ? { ...r, ...updates } : r);
        return { data: updates, error: null };
    },

    // 후기 삭제
    async deleteReview(id) {
        // 목업 삭제
        localReviews = localReviews.filter(r => r.id !== id);
        return { error: null };
    },

    // 좋아요 토글
    async toggleLike(reviewId, userId) {
        // 목업 토글
        localReviews = localReviews.map(r => {
            if (r.id === reviewId) {
                const isLiked = !r.is_liked;
                return {
                    ...r,
                    is_liked: isLiked,
                    likes: isLiked ? r.likes + 1 : r.likes - 1
                };
            }
            return r;
        });
        return { error: null };
    },

    // 댓글 가져오기
    async getComments(reviewId) {
        return { data: localComments[reviewId] || [], error: null };
    },

    // 댓글 작성
    async addComment(reviewId, commentData) {
        const newComment = {
            id: String(Date.now()),
            ...commentData,
            parent_id: commentData.parent_id || null,
            created_at: new Date().toISOString()
        };

        if (!localComments[reviewId]) {
            localComments[reviewId] = [];
        }
        localComments[reviewId].push(newComment);

        // 리뷰의 댓글 수 업데이트
        localReviews = localReviews.map(r =>
            r.id === reviewId ? { ...r, comments: r.comments + 1 } : r
        );

        return { data: newComment, error: null };
    },

    // 댓글 삭제
    async deleteComment(reviewId, commentId) {
        if (!localComments[reviewId]) return { error: 'Not found' };

        // 해당 댓글과 그 답글들까지 삭제 시도 (심플하게 필터링)
        const originalCount = localComments[reviewId].length;
        localComments[reviewId] = localComments[reviewId].filter(c => c.id !== commentId && c.parent_id !== commentId);
        const deletedCount = originalCount - localComments[reviewId].length;

        // 리뷰의 댓글 수 업데이트
        localReviews = localReviews.map(r =>
            r.id === reviewId ? { ...r, comments: Math.max(0, r.comments - deletedCount) } : r
        );

        return { error: null };
    }
};
