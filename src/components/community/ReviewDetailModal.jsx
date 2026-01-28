import { useState, useEffect, useRef } from 'react';
import { FaStar, FaHeart, FaRegHeart, FaArrowLeft, FaArrowRight, FaPaperPlane, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { communityService } from '../../services/communityService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ReviewDetailModal({ review, onClose, onLike, onEdit, onDelete, focusComment, onUpdatePost }) {
    const { user } = useAuthStore();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // { id, author_name }
    const [loadingComments, setLoadingComments] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState(null);
    const commentInputRef = useRef(null);
    const commentsSectionRef = useRef(null);

    // 댓글 입력창 포커스 처리 및 스크롤
    useEffect(() => {
        if (focusComment) {
            setTimeout(() => {
                if (commentsSectionRef.current) {
                    commentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                }
                if (commentInputRef.current) {
                    commentInputRef.current.focus({ preventScroll: true }); // prevent scroll to input, we want scroll to section
                }
            }, 300);
        }
    }, [focusComment]);

    // 미디어 배열 (없으면 빈 배열)
    const mediaList = review.media || [];

    // 날짜 포맷팅
    const timeAgo = review.created_at 
        ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko })
        : (review.date || '날짜 정보 없음');

    // 댓글 로드
    const loadComments = async () => {
        setLoadingComments(true);
        const { data, error } = await communityService.getComments(review.id);
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

        const { data, error } = await communityService.addComment(review.id, commentData);
        if (!error) {
            const updatedComments = [...comments, data];
            setComments(updatedComments);
            setNewComment('');
            setReplyingTo(null);
            // toast removed as requested
            
            // 상위 컴포넌트 업데이트 (댓글 수 증가)
            if (onUpdatePost) {
                const count = updatedComments.length;
                onUpdatePost({ ...review, comments: count, comment_count: count });
            }
            
            // 새 댓글이 달리면 댓글 섹션으로 스크롤 (옵션)
            if (commentsSectionRef.current) {
                // 부드럽게 스크롤
                 commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

        } else {
            toast.error('댓글 작성 실패');
        }
    };

    const handleDeleteComment = async (commentId) => {
        // Confirmation is handled in UI

        const { error } = await communityService.deleteComment(review.id, commentId);
        if (!error) {
            const updatedComments = comments.filter(c => c.id !== commentId && c.parent_id !== commentId);
            setComments(updatedComments);


            if (onUpdatePost) {
                const count = updatedComments.length;
                onUpdatePost({ ...review, comments: count, comment_count: count });
            }
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
                        <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="author-info">
                                    <img
                                        src={review.author_avatar || `https://ui-avatars.com/api/?name=${review.author_name || '익명'}&background=3b82f6&color=fff`}
                                        alt={review.author_name || '익명'}
                                        className="author-avatar small"
                                    />
                                    <div className="author-details">
                                        <h4>{review.author_name || '익명'}</h4>
                                        <span className="review-destination">{review.destination}</span>
                                    </div>
                                </div>
                                <div className="rating" style={{ display: 'flex', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} color={i < (review.rating || 0) ? "#fbbf24" : "#e5e7eb"} size={16} />
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="scrollable-content">
                            <div className="wellness-tags" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                {review.mood && (
                                    <span className="wellness-tag mood" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', fontWeight: '500' }}>
                                        {review.mood === 'romantic' ? '🌹 낭만' :
                                            review.mood === 'refresh' ? '🌈 리프레시' :
                                                review.mood === 'active' ? '👟 에너지 충전' : '🤫 고요한 휴식'}
                                    </span>
                                )}
                                {review.themes?.map(theme => (
                                    <span key={theme} className="wellness-tag theme" style={{ background: '#d1fae5', color: '#047857', fontSize: '0.85rem', padding: '4px 12px', borderRadius: '16px', fontWeight: '500' }}>
                                        {theme === 'activity' ? '🪂 액티비티' :
                                            theme === 'food' ? '🍱 맛집 탐방' : '🌿 힐링/휴식'}
                                    </span>
                                ))}
                            </div>
                            <p className="detail-text">{review.content || review.body}</p>
                            <p className="detail-date" style={{ marginBottom: '20px' }}>{timeAgo}</p>

                            <div className="action-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 0 12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '20px' }}>
                                <button
                                    className={`action-btn ${review.is_liked ? 'liked' : ''}`}
                                    onClick={() => onLike(review.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: review.is_liked ? '#ef4444' : '#6b7280',
                                        transition: 'all 0.2s',
                                        padding: '4px'
                                    }}
                                >
                                    {review.is_liked ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
                                </button>
                                <span className="likes-count" style={{ fontWeight: '600', color: '#4b5563', fontSize: '0.95rem' }}>좋아요 {review.likes}개</span>
                                
                                {/* 내 글인 경우 수정/삭제 (하단 배치) */}
                                {user && user.id === review.user_id && (
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', position: 'relative' }}>
                                        {showDeleteConfirm ? (
                                            <div style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: '#fef2f2',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                border: '1px solid #fee2e2',
                                                whiteSpace: 'nowrap',
                                                zIndex: 10,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600', marginRight: '4px' }}>삭제하시겠습니까?</span>
                                                <button
                                                    onClick={() => onDelete(review.id)}
                                                    style={{
                                                        background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px',
                                                        padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'
                                                    }}
                                                >
                                                    예
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    style={{
                                                        background: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '4px',
                                                        padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'
                                                    }}
                                                >
                                                    아니오
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => { onClose(); onEdit && onEdit(review); }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.85rem',
                                                        color: '#6b7280'
                                                    }}
                                                >
                                                    <FaEdit size={14} /> 수정
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.85rem',
                                                        color: '#ef4444'
                                                    }}
                                                >
                                                   <FaTrash size={14} /> 삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="comments-section" style={{ marginTop: '0' }} ref={commentsSectionRef}>
                                <h5 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>댓글 {comments.length}개</h5>
                                {loadingComments ? (
                                    <p>댓글 로딩 중...</p>
                                ) : (
                                    <div className="comments-list">
                                        {comments.filter(c => !c.parent_id).map(comment => (
                                            <div key={comment.id} className="comment-group" style={{ marginBottom: '1.2rem' }}>
                                                <div className="comment-item" style={{ display: 'flex', gap: '10px' }}>
                                                    <img
                                                        src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name || '익명'}&background=3b82f6&color=fff`}
                                                        alt={comment.author_name || '익명'}
                                                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div className="comment-main">
                                                        <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="comment-author">
                                                                {comment.author_name || '익명'}
                                                                {review.user_id === comment.user_id && (
                                                                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dbeafe', fontWeight: 'bold' }}>작성자</span>
                                                                )}
                                                            </span>
                                                            <span className="comment-time" style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                                            </span>
                                                        </div>
                                                        <span className="comment-text">{comment.content}</span>
                                                        <div className="comment-actions">
                                                            <button className="reply-btn" onClick={() => { setReplyingTo({ id: comment.id, author_name: comment.author_name }); setTimeout(() => commentInputRef.current?.focus(), 100); }}>답글달기</button>
                                                            {user && user.id === comment.user_id && (
                                                                commentToDeleteId === comment.id ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>삭제하시겠습니까?</span>
                                                                        <button onClick={() => handleDeleteComment(comment.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>예</button>
                                                                        <button onClick={() => setCommentToDeleteId(null)} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>아니오</button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="del-btn" style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCommentToDeleteId(comment.id)}>
                                                                        <FaTrash /> 삭제
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 답글 리스트 */}
                                                <div className="replies-list" style={{ marginLeft: '2.5rem', marginTop: '0.8rem', borderLeft: '1px solid #333', paddingLeft: '1rem' }}>
                                                    {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                        <div key={reply.id} className="comment-item reply" style={{ marginBottom: '0.8rem', display: 'flex', gap: '8px' }}>
                                                            <img
                                                                src={reply.author_avatar || `https://ui-avatars.com/api/?name=${reply.author_name}&background=3b82f6&color=fff`}
                                                                alt={reply.author_name}
                                                                style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                            <div className="comment-main">
                                                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span className="comment-author">
                                                                        {reply.author_name}
                                                                        {review.user_id === reply.user_id && (
                                                                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dbeafe', fontWeight: 'bold' }}>작성자</span>
                                                                        )}
                                                                    </span>
                                                                    <span className="comment-time" style={{ fontSize: '0.75rem', color: '#666' }}>
                                                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko })}
                                                                    </span>
                                                                </div>
                                                                <span className="comment-text">{reply.content}</span>
                                                                {user && user.id === reply.user_id && (
                                                                    <div className="comment-actions" style={{ marginTop: '0.4rem', position: 'relative' }}>
                                                                        {commentToDeleteId === reply.id ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', whiteSpace: 'nowrap' }}>
                                                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>삭제하시겠습니까?</span>
                                                                                <button onClick={() => handleDeleteComment(reply.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>예</button>
                                                                                <button onClick={() => setCommentToDeleteId(null)} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>아니오</button>
                                                                            </div>
                                                                        ) : (
                                                                            <button className="del-btn" style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCommentToDeleteId(reply.id)}>
                                                                                <FaTrash /> 삭제
                                                                            </button>
                                                                        )}
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
                            {replyingTo && (
                                <div className="reply-hint">
                                    <span style={{ color: '#60a5fa' }}>@{replyingTo.author_name}님에게 답글 남기는 중...</span>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                </div>
                            )}

                            <form className="comment-form" onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1, background: '#f9fafb', borderRadius: '24px', padding: '10px 16px', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        ref={commentInputRef}
                                        type="text"
                                        placeholder={replyingTo ? "답글을 입력하세요..." : "따뜻한 댓글을 남겨주세요..."}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '0.95rem',
                                            color: '#1f2937'
                                        }}
                                    />
                                </div>
                                <button type="submit" disabled={!newComment.trim()} style={{ background: 'none', border: 'none', color: newComment.trim() ? '#3b82f6' : '#d1d5db', cursor: newComment.trim() ? 'pointer' : 'default', padding: '8px' }}><FaPaperPlane size={20} /></button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
