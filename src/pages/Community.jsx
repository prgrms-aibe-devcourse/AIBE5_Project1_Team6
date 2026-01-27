import { useState, useEffect } from 'react';
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
import '../styles/Community.css';
import toast from 'react-hot-toast';

export default function Community() {
    const { user } = useAuthStore();
    const [category, setCategory] = useState('free'); // 'free' or 'review'
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
    }, [category, sortBy, activeSearchKeyword, searchType, wellnessOptions]);

    // 카테고리 변경 시 초기화
    useEffect(() => {
        setSearchType(category === 'review' ? 'destination' : 'title');
        setActiveSearchKeyword('');
        setKeywordInput('');
    }, [category]);

    const handleSearchTrigger = () => {
        setActiveSearchKeyword(keywordInput);
    };

    // 저장 핸들러 (작성/수정)
    const handleSavePost = async (formData) => {
        const postData = {
            ...formData,
            category: category,
            user_id: user?.id,
            author_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명',
            author_avatar: user?.user_metadata?.avatar_url || ''
        };

        if (editingPost) {
            const { error } = await communityService.updatePost(editingPost.id, postData);
            if (!error) {
                toast.success('수정되었습니다.');
                loadPosts();
                setIsModalOpen(false);
                setEditingPost(null);
            }
        } else {
            const { data, error } = await communityService.createPost(postData);
            if (!error) {
                toast.success('작성되었습니다.');
                loadPosts();
                setIsModalOpen(false);
            } else {
                console.error('게시글 작성 실패:', error);
                toast.error('게시글 작성에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
            }
        }
    };

    // 삭제 핸들러
    const handleDelete = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await communityService.deletePost(id);
            if (!error) {
                toast.success('삭제되었습니다.');
                loadPosts();
            }
        }
    };

    // 좋아요 핸들러
    const handleLike = async (id) => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }
        await communityService.toggleLike(id, user.id);
        loadPosts().then(() => {
            if (viewingPost && viewingPost.id === id) {
                setViewingPost(prev => {
                    if (!prev) return null;
                    const isLiked = !prev.is_liked;
                    return {
                        ...prev,
                        is_liked: isLiked,
                        likes: isLiked ? prev.likes + 1 : prev.likes - 1
                    };
                });
            }
        });
    };

    return (
        <div className="reviews-container">
            <CommunityHeader
                activeCategory={category}
                onCategoryChange={setCategory}
            />

            <div className="community-content" style={{ marginTop: '20px' }}>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                    {category === 'review' ? '다른 여행자들의 생생한 후기를 확인해보세요.' : '자유롭게 이야기를 나누고 정보를 공유해보세요.'}
                </p>

                <div className="reviews-controls-container" style={{ marginBottom: '24px' }}>
                    <div className="reviews-actions-row">
                        <span className="total-count">
                            총 {posts.length}개의 {category === 'review' ? '후기' : '글'}
                        </span>
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
                        <div className="wellness-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '1rem 0', marginBottom: '1rem' }}>
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
                            {/* 무드/테마 버튼들 동일하게 배치... */}
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
                            {loading ? <p>로딩 중...</p> : posts.length > 0 ? (
                                posts.map(post => (
                                    <ReviewCard
                                        key={post.id} post={post} review={post} // 호환성
                                        currentUser={user} onLike={handleLike} onDelete={handleDelete}
                                        onEdit={(p) => { setEditingPost(p); setIsModalOpen(true); }}
                                        onClick={(p) => setViewingPost(p)}
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
                    loading ? (
                        <p style={{ textAlign: 'center', padding: '3rem' }}>로딩 중...</p>
                    ) : posts.length > 0 ? (
                        <FreeBoardList
                            posts={posts}
                            currentUser={user}
                            onPostClick={(p) => {
                                setViewingPost(p);
                            }}
                            onEdit={(p) => { setEditingPost(p); setIsModalOpen(true); }}
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

            {/* 기존 플로팅 버튼 유지 요청 대응 */}
            {user && (
                <button className="floating-fab" onClick={() => {
                    setEditingPost(null);
                    setIsModalOpen(true);
                }}>
                    <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>✍️</span>
                    <span style={{ fontWeight: 'bold' }}>글쓰기</span>
                </button>
            )}

            {/* 모달들 */}
            <AnimatePresence>
                {isModalOpen && (
                    <ReviewForm
                        initialData={editingPost}
                        onSubmit={handleSavePost}
                        onClose={() => setIsModalOpen(false)}
                        category={category}
                    />
                )}
            </AnimatePresence>

            {viewingPost && (
                viewingPost.category === 'free' ? (
                    <FreeBoardDetailModal
                        post={viewingPost}
                        onClose={() => setViewingPost(null)}
                        onLike={handleLike}
                        onEdit={(p) => { setEditingPost(p); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                    />
                ) : (
                    <ReviewDetailModal
                        review={viewingPost}
                        onClose={() => setViewingPost(null)}
                        onLike={handleLike}
                        onEdit={(p) => { setEditingPost(p); setIsModalOpen(true); }}
                        onDelete={handleDelete}
                    />
                )
            )}
        </div>
    );
}
