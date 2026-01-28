import { useState, useEffect, useRef } from 'react';
import { FaHeart, FaRegHeart, FaPaperPlane, FaTrash, FaEdit, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { communityService } from '../../services/communityService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function FreeBoardDetailModal({ post, onClose, onLike, onEdit, onDelete, focusComment, onUpdatePost }) {
    const { user } = useAuthStore();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const mediaList = post.media || [];
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loadingComments, setLoadingComments] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = useState(null);
    const commentInputRef = useRef(null);
    const commentsSectionRef = useRef(null);

    // 댓글 입력창 포커스 처리
    useEffect(() => {
        if (focusComment) {
            setTimeout(() => {
                if (commentsSectionRef.current) {
                    commentsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                }
                if (commentInputRef.current) {
                    commentInputRef.current.focus({ preventScroll: true });
                }
            }, 300); // 모달 애니메이션 고려
        }
    }, [focusComment]);

    // 날짜 포맷팅
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko });

    // 댓글 로드
    const loadComments = async () => {
        setLoadingComments(true);
        const { data, error } = await communityService.getComments(post.id);
        if (!error) {
            setComments(data);
        }
        setLoadingComments(false);
    };

    useEffect(() => {
        loadComments();
    }, [post.id]);

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

        const { data, error } = await communityService.addComment(post.id, commentData);
        if (!error) {
            const updatedComments = [...comments, data];
            setComments(updatedComments);
            setNewComment('');
            setReplyingTo(null);
            // toast removed
            
            // 상위 컴포넌트 업데이트 (댓글 수 증가)
            if (onUpdatePost) {
                const count = updatedComments.length;
                onUpdatePost({ ...post, comments: count, comment_count: count });
            }

            // 새 댓글로 스크롤
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

        const { error } = await communityService.deleteComment(post.id, commentId);
        if (!error) {
            const updatedComments = comments.filter(c => c.id !== commentId && c.parent_id !== commentId);
            setComments(updatedComments);


            if (onUpdatePost) {
                const count = updatedComments.length;
                onUpdatePost({ ...post, comments: count, comment_count: count });
            }
        } else {
            toast.error('삭제 실패');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content review-detail-modal ${mediaList.length === 0 ? 'no-media' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="detail-layout" style={{ display: 'flex', height: '100%' }}>
                    {/* Left: Media Section (Only if media exists) */}
                    {mediaList.length > 0 && (
                        <div className="detail-media-section" style={{ flex: '1.5', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                             <div className="media-carousel" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {((typeof mediaList[currentMediaIndex] === 'string' && (mediaList[currentMediaIndex].endsWith('.mp4') || mediaList[currentMediaIndex].endsWith('.webm'))) || mediaList[currentMediaIndex].type === 'video') ? (
                                    <video src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} controls className="detail-media" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                ) : (
                                    <img src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} alt="Post media" className="detail-media" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                )}

                                {mediaList.length > 1 && (
                                    <>
                                        <button className="carousel-btn prev" onClick={handlePrevMedia} style={{ position: 'absolute', left: '20px', zIndex: 10 }}><FaArrowLeft /></button>
                                        <button className="carousel-btn next" onClick={handleNextMedia} style={{ position: 'absolute', right: '20px', zIndex: 10 }}><FaArrowRight /></button>
                                        <div className="carousel-indicators" style={{ position: 'absolute', bottom: '20px' }}>
                                            {mediaList.map((_, idx) => (
                                                <span key={idx} className={`indicator ${idx === currentMediaIndex ? 'active' : ''}`} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right: Content Section */}
                    <div className="detail-content-section" style={{ flex: '1', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: mediaList.length > 0 ? '1px solid #eee' : 'none' }}>
                        <div className="detail-header" style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                            <div className="author-info">
                                <img
                                    src={post.author_avatar || `https://ui-avatars.com/api/?name=${post.author_name || '익명'}&background=3b82f6&color=fff`}
                                    alt={post.author_name || '익명'}
                                    className="author-avatar small"
                                />
                                <div className="author-details">
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{post.author_name || '익명'}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{timeAgo}</span>
                                </div>
                            </div>

                        </div>

                        <div className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {post.title && <h2 className="detail-title" style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px', color: '#111827' }}>{post.title}</h2>}

                            <p className="detail-text" style={{ fontSize: '1rem', lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                                {post.content || post.body}
                            </p>

                             {/* If No Media, content takes full width. If media exists, it's on left. This is handled by main layout.
                                But if media list is empty, we don't show left column. */}

                            <div className="action-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 0 12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <button
                                    className={`action-btn ${post.is_liked ? 'liked' : ''}`}
                                    onClick={() => onLike(post.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: post.is_liked ? '#ef4444' : '#6b7280',
                                        transition: 'all 0.2s',
                                        padding: '4px'
                                    }}
                                >
                                    {post.is_liked ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
                                </button>
                                <span className="likes-count" style={{ fontWeight: '600', color: '#4b5563', fontSize: '0.95rem' }}>좋아요 {post.like_count || post.likes || 0}개</span>
                                
                                {/* 내 글인 경우 수정/삭제 (하단 배치) */}
                                {user && user.id === post.user_id && (
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
                                                    onClick={() => onDelete(post.id)}
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
                                                    onClick={() => { onClose(); onEdit && onEdit(post); }}
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

                            <div className="comments-section" style={{ marginTop: '16px' }} ref={commentsSectionRef}>
                                <h5 style={{ marginBottom: '20px', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>댓글 {comments.length}개</h5>
                                {loadingComments ? (
                                    <p className="loading-text" style={{ textAlign: 'center', color: '#9ca3af' }}>댓글 로딩 중...</p>
                                ) : (
                                    <div className="comments-list">
                                        {comments.filter(c => !c.parent_id).map(comment => (
                                            <div key={comment.id} className="comment-group" style={{ marginBottom: '1.5rem' }}>
                                                <div className="comment-item" style={{ display: 'flex', gap: '12px' }}>
                                                    <img
                                                        src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name || '익명'}&background=3b82f6&color=fff`}
                                                        alt={comment.author_name || '익명'}
                                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div className="comment-main" style={{ flex: 1 }}>
                                                        <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                            <span className="comment-author" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                                {comment.author_name || '익명'}
                                                                {post.user_id === comment.user_id && (
                                                                    <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dbeafe', fontWeight: 'bold' }}>작성자</span>
                                                                )}
                                                            </span>
                                                            <span className="comment-time" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                                            </span>
                                                        </div>
                                                        <span className="comment-text" style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>{comment.content}</span>
                                                        <div className="comment-actions" style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                                                            <button className="reply-btn" style={{ fontSize: '0.8rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => { setReplyingTo({ id: comment.id, author_name: comment.author_name }); setTimeout(() => commentInputRef.current?.focus(), 100); }}>
                                                                답글달기
                                                            </button>
                                                            {user && user.id === comment.user_id && (
                                                                commentToDeleteId === comment.id ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>삭제하시겠습니까?</span>
                                                                        <button onClick={() => handleDeleteComment(comment.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>예</button>
                                                                        <button onClick={() => setCommentToDeleteId(null)} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>아니오</button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="del-btn" style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setCommentToDeleteId(comment.id)}>
                                                                        삭제
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="replies-list" style={{ marginLeft: '44px', marginTop: '8px' }}>
                                                    {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                        <div key={reply.id} className="comment-item reply" style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
                                                            <img
                                                                src={reply.author_avatar || `https://ui-avatars.com/api/?name=${reply.author_name}&background=3b82f6&color=fff`}
                                                                alt={reply.author_name}
                                                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                            <div className="comment-main" style={{ flex: 1 }}>
                                                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                                    <span className="comment-author" style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                                                        {reply.author_name}
                                                                        {post.user_id === reply.user_id && (
                                                                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #dbeafe', fontWeight: 'bold' }}>작성자</span>
                                                                        )}
                                                                    </span>
                                                                    <span className="comment-time" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                                                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko })}
                                                                    </span>
                                                                </div>
                                                                <span className="comment-text" style={{ fontSize: '0.85rem', color: '#4b5563' }}>{reply.content}</span>
                                                                {user && user.id === reply.user_id && (
                                                                    <div className="comment-actions" style={{ marginTop: '4px', position: 'relative' }}>
                                                                        {commentToDeleteId === reply.id ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', whiteSpace: 'nowrap' }}>
                                                                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>삭제하시겠습니까?</span>
                                                                                <button onClick={() => handleDeleteComment(reply.id)} style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>예</button>
                                                                                <button onClick={() => setCommentToDeleteId(null)} style={{ fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>아니오</button>
                                                                            </div>
                                                                        ) : (
                                                                            <button className="del-btn" style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setCommentToDeleteId(reply.id)}>
                                                                                삭제
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

                        <div className="detail-footer" style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', background: '#fff' }}>
                            {replyingTo && (
                                <div className="reply-hint" style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ color: '#3b82f6', fontSize: '0.8rem' }}>@{replyingTo.author_name}님에게 답글 남기는 중</span>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
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
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: newComment.trim() ? '#3b82f6' : '#d1d5db',
                                        cursor: newComment.trim() ? 'pointer' : 'default',
                                        padding: '8px',
                                        transition: 'color 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <FaPaperPlane size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
