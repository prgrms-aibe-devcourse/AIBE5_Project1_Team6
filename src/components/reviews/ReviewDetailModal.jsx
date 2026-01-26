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
    const [replyingTo, setReplyingTo] = useState(null); // { id, author_name }
    const [loadingComments, setLoadingComments] = useState(true);

    // 미디어 배열 (없으면 빈 배열)
    const mediaList = review.media || [];

    // 날짜 포맷팅
    const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko });

    // 댓글 로드
    const loadComments = async () => {
        setLoadingComments(true);
        const { data, error } = await reviewService.getComments(review.id);
        if (!error) {
            setComments(data);
        }
        setLoadingComments(false);
    };

    useEffect(() => {
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
            author_name: user?.user_metadata?.full_name || user.email.split('@')[0],
            author_avatar: user.user_metadata?.avatar_url || '',
            content: newComment,
            parent_id: replyingTo ? replyingTo.id : null
        };

        const { data, error } = await reviewService.addComment(review.id, commentData);
        if (!error) {
            setComments([...comments, data]);
            setNewComment('');
            setReplyingTo(null);
            toast.success(replyingTo ? '답글이 작성되었습니다.' : '댓글이 작성되었습니다.');
        } else {
            toast.error('댓글 작성 실패');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        const { error } = await reviewService.deleteComment(review.id, commentId);
        if (!error) {
            setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
            toast.success('삭제되었습니다.');
        } else {
            toast.error('삭제 실패');
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
                                {((typeof mediaList[currentMediaIndex] === 'string' && (mediaList[currentMediaIndex].endsWith('.mp4') || mediaList[currentMediaIndex].endsWith('.webm'))) || mediaList[currentMediaIndex].type === 'video') ? (
                                    <video src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} controls className="detail-media" />
                                ) : (
                                    <img src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} alt="Review media" className="detail-media" />
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
                                    src={review.author_avatar || `https://ui-avatars.com/api/?name=${review.author_name || '익명'}&background=random`}
                                    alt={review.author_name || '익명'}
                                    className="author-avatar small"
                                />
                                <div>
                                    <h4>{review.author_name || '익명'}</h4>
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
                                        {review.mood === 'romantic' ? '🌹 낭만' :
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
                                        {comments.filter(c => !c.parent_id).map(comment => (
                                            <div key={comment.id} className="comment-group" style={{ marginBottom: '1.2rem' }}>
                                                <div className="comment-item" style={{ display: 'flex', gap: '10px' }}>
                                                    <img
                                                        src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name || '익명'}&background=random`}
                                                        alt={comment.author_name || '익명'}
                                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div className="comment-main">
                                                        <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="comment-author">{comment.author_name || '익명'}</span>
                                                            <span className="comment-time" style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                                            </span>
                                                        </div>
                                                        <span className="comment-text">{comment.content}</span>
                                                        <div className="comment-actions">
                                                            <button className="reply-btn" onClick={() => setReplyingTo({ id: comment.id, author_name: comment.author_name })}>답글달기</button>
                                                            {user && (user.id === comment.user_id || comment.user_id.startsWith('mock-')) && (
                                                                <button className="del-btn" onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 답글 리스트 */}
                                                <div className="replies-list" style={{ marginLeft: '2.5rem', marginTop: '0.8rem', borderLeft: '1px solid #333', paddingLeft: '1rem' }}>
                                                    {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                        <div key={reply.id} className="comment-item reply" style={{ marginBottom: '0.8rem', display: 'flex', gap: '8px' }}>
                                                            <img
                                                                src={reply.author_avatar || `https://ui-avatars.com/api/?name=${reply.author_name}&background=random`}
                                                                alt={reply.author_name}
                                                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                            <div className="comment-main">
                                                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span className="comment-author">{reply.author_name}</span>
                                                                    <span className="comment-time" style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko })}
                                                                    </span>
                                                                </div>
                                                                <span className="comment-text">{reply.content}</span>
                                                                {user && (user.id === reply.user_id || reply.user_id.startsWith('mock-')) && (
                                                                    <div className="comment-actions">
                                                                        <button className="del-btn" onClick={() => handleDeleteComment(reply.id)}>삭제</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
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

                            {replyingTo && (
                                <div className="reply-hint" style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#60a5fa' }}>@{replyingTo.author_name}님에게 답글 남기는 중...</span>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                </div>
                            )}

                            <form className="comment-form" onSubmit={handleSubmitComment}>
                                <input
                                    type="text"
                                    placeholder={replyingTo ? "답글 달기..." : "댓글 달기..."}
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
