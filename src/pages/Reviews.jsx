import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useTripStore } from '../stores/tripStore';
import { reviewService } from '../services/reviewService';
import ReviewCard from '../components/reviews/ReviewCard';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewDetailModal from '../components/reviews/ReviewDetailModal';
import { FaPen, FaSearch } from 'react-icons/fa';
import '../styles/Reviews.css';
import toast from 'react-hot-toast';

export default function Reviews() {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // 검색 및 정렬 상태
    const [searchType, setSearchType] = useState('destination');
    const [keywordInput, setKeywordInput] = useState('');
    const [activeSearchKeyword, setActiveSearchKeyword] = useState('');
    const [sortBy, setSortBy] = useState('latest'); // 'latest' 또는 'likes'

    // 웰니스 필터 상태
    const tripStore = useTripStore();
    const [wellnessOptions, setWellnessOptions] = useState({
        mood: null,
        themes: []
    });

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [viewingReview, setViewingReview] = useState(null); // 상세보기 상태

    // 데이터 불러오기
    const loadReviews = async () => {
        setLoading(true);
        const { data, error } = await reviewService.getReviews(
            sortBy,
            { type: searchType, keyword: activeSearchKeyword },
            wellnessOptions,
            user?.id
        );

        if (error) {
            toast.error('후기를 불러오는데 실패했습니다.');
        } else {
            setReviews(data);
        }
        setLoading(false);
    };

    // 초기 로드 및 필터 변경 시 재로드
    useEffect(() => {
        loadReviews();
    }, [sortBy, activeSearchKeyword, wellnessOptions]);

    const handleSearchTrigger = () => {
        setActiveSearchKeyword(keywordInput);
    };

    // 후기 작성/수정 핸들러
    const handleSaveReview = async (formData) => {
        if (editingReview) {
            // 수정
            const { error } = await reviewService.updateReview(editingReview.id, formData);
            if (!error) {
                toast.success('후기가 수정되었습니다.');
                loadReviews();
                setIsModalOpen(false);
                setEditingReview(null);
            }
        } else {
            // 생성
            const newReview = {
                ...formData,
                user_id: user?.id,
                author_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명',
                author_avatar: user?.user_metadata?.avatar_url || ''
            };

            const { error } = await reviewService.createReview(newReview);
            if (!error) {
                toast.success('후기가 작성되었습니다.');
                loadReviews();
                setIsModalOpen(false);
            }
        }
    };

    // 삭제 핸들러
    const handleDelete = async (id) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            const { error } = await reviewService.deleteReview(id);
            if (!error) {
                toast.success('후기가 삭제되었습니다.');
                loadReviews();
            }
        }
    };

    // 좋아요 핸들러
    const handleLike = async (id) => {
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }
        await reviewService.toggleLike(id, user.id);

        // 상세 보기 중이라면 상세 데이터도 업데이트
        loadReviews().then(() => {
            if (viewingReview && viewingReview.id === id) {
                setViewingReview(prev => {
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
            <div className="reviews-header">
                <h1
                    className="reviews-title"
                    onClick={() => {
                        setKeywordInput('');
                        setActiveSearchKeyword('');
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    여행 후기
                </h1>
                <p className="reviews-subtitle">다른 여행자들의 생생한 후기를 확인해보세요.</p>

                <div className="reviews-controls-container">
                    <div className="reviews-actions-row">
                        <span className="total-count">총 {reviews.length}개의 후기</span>

                        <div className="custom-sort-dropdown">
                            <button
                                className="sort-trigger"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                            >
                                {sortBy === 'likes' ? '↑↓ 추천순' : '↑↓ 최신순'}
                            </button>
                            {isSortOpen && (
                                <div className="sort-menu">
                                    <div
                                        className={`sort-item ${sortBy === 'likes' ? 'active' : ''}`}
                                        onClick={() => { setSortBy('likes'); setIsSortOpen(false); }}
                                    >
                                        추천순 {sortBy === 'likes' && '✔'}
                                    </div>
                                    <div
                                        className={`sort-item ${sortBy === 'latest' ? 'active' : ''}`}
                                        onClick={() => { setSortBy('latest'); setIsSortOpen(false); }}
                                    >
                                        최신순 {sortBy === 'latest' && '✔'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="search-bar-row">
                        <select
                            className="search-select"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                        >
                            <option value="destination">여행지</option>
                            <option value="author">작성자</option>
                            <option value="content">내용</option>
                        </select>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="검색어를 입력하세요..."
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearchTrigger();
                                }}
                            />
                            <FaSearch
                                className="search-icon"
                                onClick={handleSearchTrigger}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    </div>
                </div>

                {/* 웰니스 필터 섹션 */}
                <div className="wellness-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '1rem 0', marginBottom: '1rem' }}>
                    <button
                        className={`wellness-chip ${!wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'active' : ''}`}
                        onClick={() => setWellnessOptions({ mood: null, themes: [] })}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'none' : '1px solid #e5e7eb',
                            background: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? '#3b82f6' : 'white',
                            color: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? 'white' : '#4b5563',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontWeight: '600',
                            boxShadow: !wellnessOptions.mood && wellnessOptions.themes.length === 0 ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                        }}
                    >
                        전체
                    </button>

                    <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px', flexShrink: 0 }}></div>

                    {/* 무드 그룹 */}
                    {[
                        { id: 'romantic', label: '🌹 낭만', type: 'mood' },
                        { id: 'refresh', label: '🌈 리프레시', type: 'mood' },
                        { id: 'active', label: '👟 에너지', type: 'mood' },
                        { id: 'calm', label: '🤫 고요함', type: 'mood' }
                    ].map(item => {
                        const isActive = wellnessOptions.mood === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`wellness-chip ${isActive ? 'active' : ''}`}
                                onClick={() => setWellnessOptions(prev => ({
                                    ...prev,
                                    mood: prev.mood === item.id ? null : item.id
                                }))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: isActive ? 'none' : '1px solid #e5e7eb',
                                    background: isActive ? '#3b82f6' : 'white',
                                    color: isActive ? 'white' : '#4b5563',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    fontWeight: '600',
                                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}

                    <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px', flexShrink: 0 }}></div>

                    {/* 테마 그룹 */}
                    {[
                        { id: 'activity', label: '🪂 액티비티', type: 'theme' },
                        { id: 'food', label: '🍱 맛집', type: 'theme' },
                        { id: 'healing', label: '🌿 힐링', type: 'theme' }
                    ].map(item => {
                        const isActive = wellnessOptions.themes.includes(item.id);
                        return (
                            <button
                                key={item.id}
                                className={`wellness-chip ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    setWellnessOptions(prev => ({
                                        ...prev,
                                        themes: prev.themes.includes(item.id)
                                            ? [] // 이미 선택된 경우 해제
                                            : [item.id] // 새로운 선택 시 기존 것 교체 (하나만 선택)
                                    }));
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: isActive ? 'none' : '1px solid #e5e7eb',
                                    background: isActive ? '#3b82f6' : 'white',
                                    color: isActive ? 'white' : '#4b5563',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    fontWeight: '600',
                                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* 개인화 추천 알림 */}
                {tripStore.mood && !wellnessOptions.mood && wellnessOptions.themes.length === 0 && (
                    <div className="personalized-recommendation" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span>✨ 당신의 최근 관심사(<strong>{tripStore.mood === 'romantic' ? '낭만 가득' : tripStore.mood === 'refresh' ? '리프레시' : tripStore.mood === 'active' ? '에너지 충전' : '고요한 휴식'}</strong>)에 맞는 후기들을 먼저 보여드릴게요!</span>
                    </div>
                )}
            </div>

            <div className="reviews-grid">
                {loading ? (
                    <p>로딩 중...</p>
                ) : reviews.length > 0 ? (
                    reviews.map(review => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            currentUser={user}
                            onLike={handleLike}
                            onDelete={handleDelete}
                            onEdit={(r) => {
                                setEditingReview(r);
                                setIsModalOpen(true);
                            }}
                            onClick={(r) => setViewingReview(r)}
                        />
                    ))
                ) : (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>검색 결과가 없습니다.</p>
                )}
            </div>

            {/* 플로팅 작성 버튼 */}
            {user && (
                <button className="floating-fab" onClick={() => {
                    setEditingReview(null);
                    setIsModalOpen(true);
                }}>
                    <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>✍️</span>
                    <span style={{ fontWeight: 'bold' }}>글쓰기</span>
                </button>
            )}

            {/* 작성/수정 모달 - AnimatePresence Added */}
            <AnimatePresence>
                {isModalOpen && (
                    <ReviewForm
                        initialData={editingReview}
                        onSubmit={handleSaveReview}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* 상세 보기 모달 */}
            {viewingReview && (
                <ReviewDetailModal
                    review={viewingReview}
                    onClose={() => setViewingReview(null)}
                    onLike={handleLike}
                />
            )}
        </div>
    );
}
