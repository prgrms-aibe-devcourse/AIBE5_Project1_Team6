import { useState, useEffect } from 'react';
import { FaStar, FaHeart, FaRegHeart, FaArrowLeft, FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { reviewService } from '../../services/reviewService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ReviewDetailModal({ review, onClose, onLike }) {
    const { user } = useAuthStore();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(true);

    // 미디어 배열 (없으면 빈 배열)
    const mediaList = review.media || [];

    // 날짜 포맷팅
    const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko });

    // 댓글 로드
    useEffect(() => {
        const loadComments = async () => {
            setLoadingComments(true);
            const { data, error } = await reviewService.getComments(review.id);
            if (!error) {
                setComments(data);
            }
            setLoadingComments(false);
        };
        loadComments();
    }, [review.id]);

    const handlePrevMedia = (e) => {
        e.stopPropagation();
        setCurrentMediaIndex(prev => (prev === 0 ? mediaList.length - 1 : prev - 1));
    };

    const handleNextMedia = (e) => {
        e.stopPropagation();
        setCurrentMediaIndex(prev => (prev === mediaList.length - 1 ? 0 : prev + 1));
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) {
            toast.error('로그인이 필요합니다.');
            return;
        }

        const commentData = {
            user_id: user.id,
            author_name: user.email.split('@')[0],
            author_avatar: '',
            content: newComment
        };

        const { data, error } = await reviewService.addComment(review.id, commentData);
        if (!error) {
            setComments([...comments, data]);
            setNewComment('');
            toast.success('댓글이 작성되었습니다.');
        } else {
            toast.error('댓글 작성 실패');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content review-detail-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="detail-layout">
                    {/* 왼쪽: 미디어 캐러셀 */}
                    <div className="detail-media-section">
                        {mediaList.length > 0 ? (
                            <div className="media-carousel">
                                {mediaList[currentMediaIndex].type === 'video' ? (
                                    <video src={mediaList[currentMediaIndex].url} controls className="detail-media" />
                                ) : (
                                    <img src={mediaList[currentMediaIndex].url} alt="Review media" className="detail-media" />
                                )}

                                {mediaList.length > 1 && (
                                    <>
                                        <button className="carousel-btn prev" onClick={handlePrevMedia}><FaArrowLeft /></button>
                                        <button className="carousel-btn next" onClick={handleNextMedia}><FaArrowRight /></button>
                                        <div className="carousel-indicators">
                                            {mediaList.map((_, idx) => (
                                                <span key={idx} className={`indicator ${idx === currentMediaIndex ? 'active' : ''}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="no-media-placeholder">이미지 없음</div>
                        )}
                    </div>

                    {/* 오른쪽: 내용 및 댓글 */}
                    <div className="detail-content-section">
                        <div className="detail-header">
                            <div className="author-info">
                                <img
                                    src={review.author_avatar || `https://ui-avatars.com/api/?name=${review.author_name}`}
                                    alt={review.author_name}
                                    className="author-avatar small"
                                />
                                <div>
                                    <h4>{review.author_name}</h4>
                                    <span className="location-tag">{review.destination}</span>
                                </div>
                            </div>
                            <div className="rating">
                                <FaStar color="#fbbf24" /> {review.rating}
                            </div>
                        </div>

                        <div className="scrollable-content">
                            <div className="wellness-tags" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                {review.mood && (
                                    <span className="wellness-tag mood" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#eee', fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                                        {review.mood === 'burnout' ? '🔥 번아웃 케어' :
                                            review.mood === 'refresh' ? '🌈 리프레시' :
                                                review.mood === 'active' ? '👟 에너지 충전' : '🤫 고요한 휴식'}
                                    </span>
                                )}
                                {review.mood && review.themes?.length > 0 && (
                                    <span style={{ color: '#4b5563', fontSize: '1rem', margin: '0 4px' }}>•</span>
                                )}
                                {review.themes?.map(theme => (
                                    <span key={theme} className="wellness-tag theme" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#bbb', fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        {theme === 'activity' ? '🪂 액티비티' :
                                            theme === 'food' ? '🍱 맛집 탐방' : '🌿 힐링/휴식'}
                                    </span>
                                ))}
                            </div>
                            <p className="detail-text">{review.content}</p>
                            <p className="detail-date">{timeAgo}</p>

                            <div className="comments-section">
                                <h5>댓글 {comments.length}개</h5>
                                {loadingComments ? (
                                    <p>댓글 로딩 중...</p>
                                ) : (
                                    <div className="comments-list">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="comment-item">
                                                <span className="comment-author">{comment.author_name}</span>
                                                <span className="comment-text">{comment.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="detail-footer">
                            <div className="action-row">
                                <button
                                    className={`action-btn ${review.is_liked ? 'liked' : ''}`}
                                    onClick={() => onLike(review.id)}
                                >
                                    {review.is_liked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                                </button>
                                <span className="likes-count" style={{ color: '#aaa' }}>좋아요 {review.likes}개</span>
                            </div>

                            <form className="comment-form" onSubmit={handleSubmitComment}>
                                <input
                                    type="text"
                                    placeholder="댓글 달기..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button type="submit" disabled={!newComment.trim()}><FaPaperPlane /></button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
