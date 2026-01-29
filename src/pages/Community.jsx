import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { communityService } from '../services/communityService';
import ReviewCard from '../components/community/ReviewCard';
import ReviewForm from '../components/community/ReviewForm';
import ReviewDetailModal from '../components/community/ReviewDetailModal';
import FreeBoardDetailModal from '../components/community/FreeBoardDetailModal';
import CommunityHeader from '../components/community/CommunityHeader';
import FreeBoardList from '../components/community/FreeBoardList';
import { FaSearch } from 'react-icons/fa';
import LoadingOverlay from '../components/LoadingOverlay';
import '../styles/Community.css';
import toast from 'react-hot-toast';

export default function Community() {
    const { user, setShowLoginPrompt } = useAuthStore();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // URL 파라미터에서 탭 상태 가져오기 (기본값: 'free')
    const category = searchParams.get('tab') || 'free'; 

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 검색 및 정렬 상태
    const [searchType, setSearchType] = useState('title');
    const [keywordInput, setKeywordInput] = useState('');
    const [activeSearchKeyword, setActiveSearchKeyword] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    // 웰니스 필터 상태 (여행 후기 전용)
    const tripStore = useTripStore();
    const [wellnessOptions, setWellnessOptions] = useState({
        mood: null,
        themes: []
    });

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [viewingPost, setViewingPost] = useState(null);
    const [autoFocusComment, setAutoFocusComment] = useState(false); // 댓글 입력 포커스 여부
    const [isSubmitting, setIsSubmitting] = useState(false); // 중복 제출 방지

    // 데이터 불러오기
    const loadPosts = async () => {
        setLoading(true);
        const { data, error } = await communityService.getPosts(
            category,
            sortBy,
            { type: searchType, keyword: activeSearchKeyword },
            wellnessOptions,
            user?.id
        );

        if (error) {
            toast.error('데이터를 불러오는데 실패했습니다.');
        } else {
            setPosts(data);
        }
        setLoading(false);
    };

    // 초기 로드 및 필터 변경 시 재로드
    useEffect(() => {
        loadPosts();
    }, [category, sortBy, activeSearchKeyword, searchType, wellnessOptions, user?.id]);

    // 카테고리 변경 시 초기화
    useEffect(() => {
        setSearchType(category === 'review' ? 'destination' : 'title');
        setActiveSearchKeyword('');
        setKeywordInput('');
    }, [category]);

    // 탭 변경 핸들러
    const handleCategoryChange = (newCategory) => {
        setSearchParams({ tab: newCategory });
    };

    const handleSearchTrigger = () => {
        setActiveSearchKeyword(keywordInput);
    };

    // 저장 핸들러 (작성/수정)
    const handleSavePost = async (formData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // 1. 이미지 업로드 처리
            const processedMedia = await Promise.all(
                (formData.media || []).map(async (item) => {
                    // 이미 URL이 있고 file 객체가 없으면 기존 이미지
                    if (!item.file) return item;

                    // 새 파일인 경우 업로드
                    try {
                        const publicUrl = await communityService.uploadImage(item.file);
                        return { ...item, url: publicUrl || item.url }; // 실패 시 기존 base64라도 반환 (혹은 에러처리)
                    } catch (e) {
                        console.error("이미지 업로드 실패", e);
                        return item;
                    }
                })
            );

            const postData = {
                ...formData,
                media: processedMedia, // 업로드된 URL이 담긴 미디어 배열 사용
                category: category,
                user_id: user?.id,
                author_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명',
                author_avatar: user?.user_metadata?.avatar_url || ''
            };

            if (editingPost) {
                const { error, data } = await communityService.updatePost(editingPost.id, postData);
                if (!error && data) {
                    toast.success('수정되었습니다.');
                    // Optimistic Update: Replace the item in the list
                    setPosts(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
                    // Update viewingPost if needed
                    if (viewingPost?.id === data.id) {
                        setViewingPost(prev => ({ ...prev, ...data }));
                    }
                    setIsModalOpen(false);
                    setEditingPost(null);
                }
            } else {
                const { data, error } = await communityService.createPost(postData);
                if (!error && data) {
                    toast.success('작성되었습니다.');
                    // Optimistic Update: Prepend the new item to the list
                    setPosts(prev => [data, ...prev]);
                    setIsModalOpen(false);
                } else {
                    console.error('게시글 작성 실패:', error);
                    toast.error('게시글 작성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 게시글 상세 보기 및 댓글 포커스 처리
    const handleOpenDetail = (post, focusComment = false) => {
        setViewingPost(post);
        setAutoFocusComment(focusComment);
    };

    // 하위 모달에서 게시글 정보 업데이트 (댓글 수, 좋아요 등) - Optimistic UI
    const handleUpdatePost = (updatedPost) => {
        // 목록 업데이트
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
        // 보고 있는 포스트 업데이트
        setViewingPost(prev => prev && prev.id === updatedPost.id ? { ...prev, ...updatedPost } : prev);
    };

    // 삭제 핸들러 (Inline confirmation already done in child components)
    const handleDelete = async (id) => {
        // Optimistic update for Delete
        const previousPosts = [...posts];
        setPosts(prev => prev.filter(post => post.id !== id));
        if (viewingPost?.id === id) setViewingPost(null);

        const { error } = await communityService.deletePost(id);
        if (error) {
            // Revert on error
            setPosts(previousPosts);
            toast.error('삭제 실패');
        }
    };

    // 좋아요 핸들러
    const handleLike = async (id) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        // 1. Optimistic update (UI 즉시 반영)
        const previousPosts = [...posts];
        const previousViewingPost = viewingPost ? { ...viewingPost } : null;

        const toggleOptimistic = (post) => {
            const isLiked = !post.is_liked;
            return {
                ...post,
                is_liked: isLiked,
                likes: isLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
            };
        };

        setPosts(prev => prev.map(post => post.id === id ? toggleOptimistic(post) : post));

        if (viewingPost && viewingPost.id === id) {
            setViewingPost(prev => toggleOptimistic(prev));
        }

        // 2. Server request
        const { error } = await communityService.toggleLike(id, user.id);
        
        if (error) {
            // Revert on error
            console.error(error);
            setPosts(previousPosts);
            if (previousViewingPost) setViewingPost(previousViewingPost);
            toast.error('좋아요 처리에 실패했습니다.');
        } else {
            // 3. Sync with Server (DB Trigger가 count를 업데이트하므로 확실한 값을 위해 재조회)
            // 약간의 딜레이를 주어 트리거 실행 시간을 확보할 수도 있지만, 보통은 즉시 반영됨.
            const { data: syncedPost } = await communityService.getPost(id, user.id);
            if (syncedPost) {
                handleUpdatePost(syncedPost);
            }
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    return (
        <div className="reviews-container">
            {/* Global Loading Overlay */}
            {loading && <LoadingOverlay message="함께 떠나는 이야기를 불러오는 중이에요!" icon="💬" />}

            <CommunityHeader
                activeCategory={category}
                onCategoryChange={handleCategoryChange}
            />

            <div className="community-content" style={{ marginTop: '20px' }}>


                <div className="reviews-controls-container" style={{ marginBottom: '24px' }}>
                    <div className="reviews-actions-row">
                        <div className="total-count-badge">
                            <span className="count-icon">📝</span>
                            <span className="count-text">
                                총 <strong className="highlight-count">{posts.length}</strong>개의 {category === 'review' ? '생생한 여행 이야기' : '자유로운 이야기'}
                            </span>
                        </div>
                        {category === 'review' && (
                            <div className="custom-sort-dropdown">
                                <button className="sort-trigger" onClick={() => setIsSortOpen(!isSortOpen)}>
                                    {sortBy === 'likes' ? '↑↓ 추천순' : '↑↓ 최신순'}
                                </button>
                                {isSortOpen && (
                                    <div className="sort-menu">
                                        <div className={`sort-item ${sortBy === 'likes' ? 'active' : ''}`} onClick={() => { setSortBy('likes'); setIsSortOpen(false); }}>추천순</div>
                                        <div className={`sort-item ${sortBy === 'latest' ? 'active' : ''}`} onClick={() => { setSortBy('latest'); setIsSortOpen(false); }}>최신순</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="search-bar-row">
                        <select
                            className="search-select"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            {category === 'review' ? (
                                <>
                                    <option value="destination">여행지</option>
                                    <option value="author">작성자</option>
                                    <option value="body">제목 + 내용</option>
                                </>
                            ) : (
                                <>
                                    <option value="title">제목</option>
                                    <option value="author">작성자</option>
                                    <option value="body">제목 + 내용</option>
                                </>
                            )}
                        </select>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="검색어를 입력하세요..."
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
                            />
                            <FaSearch className="search-icon" onClick={handleSearchTrigger} style={{ cursor: 'pointer' }} />
                        </div>
                    </div>
                </div>

                {category === 'review' ? (
                    <>
                        {/* 웰니스 필터 */}
                        <div className="wellness-filter-bar">
                            <button
                                className={`wellness-chip ${!wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'active' : ''}`}
                                onClick={() => setWellnessOptions({ mood: null, themes: [] })}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                                    background: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? '#3b82f6' : 'white',
                                    color: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'white' : '#4b5563',
                                    border: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'none' : '1px solid #e5e7eb'
                                }}
                            >전체</button>
                            <span style={{ color: '#e5e7eb', margin: '0 4px', userSelect: 'none' }}>|</span>
                            {[
                                { id: 'romantic', label: '🌹 낭만' },
                                { id: 'refresh', label: '🌈 리프레시' },
                                { id: 'active', label: '👟 에너지 충전' },
                                { id: 'calm', label: '🤫 고요한 휴식' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                                        background: wellnessOptions.mood === item.id ? '#dbeafe' : 'white',
                                        color: wellnessOptions.mood === item.id ? '#1d4ed8' : '#4b5563',
                                        border: '1px solid #e5e7eb'
                                    }}
                                    onClick={() => setWellnessOptions(prev => ({ ...prev, mood: prev.mood === item.id ? null : item.id }))}
                                >{item.label}</button>
                            ))}
                            <span style={{ color: '#e5e7eb', margin: '0 4px', userSelect: 'none' }}>|</span>
                            {[
                                { id: 'activity', label: '🪂 액티비티' },
                                { id: 'food', label: '🍱 맛집 탐방' },
                                { id: 'healing', label: '🌿 힐링/휴식' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    style={{
                                        padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer', flexShrink: 0,
                                        background: wellnessOptions.themes.includes(item.id) ? '#d1fae5' : 'white',
                                        color: wellnessOptions.themes.includes(item.id) ? '#047857' : '#4b5563',
                                        border: '1px solid #e5e7eb'
                                    }}
                                    onClick={() => setWellnessOptions(prev => ({
                                        ...prev,
                                        themes: prev.themes.includes(item.id) ? [] : [item.id]
                                    }))}
                                >{item.label}</button>
                            ))}
                        </div>

                        <div className="reviews-grid">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <ReviewCard
                                        key={post.id} post={post} review={post}
                                        currentUser={user} onLike={handleLike} onDelete={handleDelete}
                                        onEdit={handleEditPost}
                                        onClick={handleOpenDetail} // (post, focusComment) 인자 전달 가능
                                    />
                                ))
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    minHeight: '300px',
                                    gridColumn: '1 / -1'
                                }}>
                                    <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>결과가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* 자유게시판 UI */
                    posts.length > 0 ? (
                        <FreeBoardList
                            posts={posts}
                            currentUser={user}
                            onPostClick={(p) => handleOpenDetail(p, false)}
                            onEdit={handleEditPost}
                            onDelete={handleDelete}
                            onLike={handleLike}
                        />
                    ) : (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            minHeight: '300px'
                        }}>
                            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>결과가 없습니다.</p>
                        </div>
                    )
                )}
            </div>

            {/* 플로팅 버튼 */}
            <button className="floating-fab" onClick={() => {
                if (!user) {
                    setShowLoginPrompt(true);
                    return;
                }
                setEditingPost(null);
                setIsModalOpen(true);
            }}>
                <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>✍️</span>
                <span style={{ fontWeight: 'bold' }}>글쓰기</span>
            </button>

            {/* 글쓰기 모달 */}
            <AnimatePresence>
                {isModalOpen && (
                    <ReviewForm
                        initialData={editingPost}
                        onSubmit={handleSavePost}
                        onClose={() => setIsModalOpen(false)}
                        category={category}
                        isSubmitting={isSubmitting}
                    />
                )}
            </AnimatePresence>

            {/* 상세 보기 모달 */}
            {viewingPost && (
                category === 'review' ? (
                    <ReviewDetailModal
                        review={viewingPost}
                        onClose={() => setViewingPost(null)}
                        onLike={handleLike}
                        onEdit={handleEditPost}
                        onDelete={handleDelete}
                        focusComment={autoFocusComment} // Prop 전달
                        onUpdatePost={handleUpdatePost} // 콜백 전달
                    />
                ) : (
                    <FreeBoardDetailModal
                        post={viewingPost}
                        onClose={() => setViewingPost(null)}
                        onLike={handleLike}
                        onEdit={handleEditPost}
                        onDelete={handleDelete}
                        focusComment={autoFocusComment} // Prop 전달
                        onUpdatePost={handleUpdatePost} // 콜백 전달
                    />
                )
            )}
        </div>
    );
}
