import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
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

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [viewingReview, setViewingReview] = useState(null); // 상세보기 상태

    // 데이터 불러오기
    const loadReviews = async () => {
        setLoading(true);
        const { data, error } = await reviewService.getReviews(sortBy, { type: searchType, keyword: activeSearchKeyword });
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
    }, [sortBy, activeSearchKeyword]);

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
                user_id: user?.id || 'guest',
                author_name: user?.email?.split('@')[0] || '익명',
                author_avatar: ''
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
                    <FaPen size={20} />
                </button>
            )}

            {/* 작성/수정 모달 */}
            {isModalOpen && (
                <ReviewForm
                    initialData={editingReview}
                    onSubmit={handleSaveReview}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

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
