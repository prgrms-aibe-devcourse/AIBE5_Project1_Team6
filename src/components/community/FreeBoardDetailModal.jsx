import { useState, useEffect, useRef } from 'react';
import { FaHeart, FaRegHeart, FaPaperPlane, FaReply, FaTrash, FaEdit } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { communityService } from '../../services/communityService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function FreeBoardDetailModal({ post, onClose, onLike, onEdit, onDelete }) {
    const { user } = useAuthStore();
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const mediaList = post.media || [];
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loadingComments, setLoadingComments] = useState(true);
    const commentInputRef = useRef(null);

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

        const { error } = await communityService.deleteComment(post.id, commentId);
        if (!error) {
            setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
            toast.success('삭제되었습니다.');
        } else {
            toast.error('삭제 실패');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content review-detail-modal ${mediaList.length === 0 ? 'no-media' : ''}`} onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                <div className="detail-layout" style={{ display: 'block' }}>
                    <div className="detail-content-section" style={{ width: '100%', borderLeft: 'none' }}>
                        <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                            <div className="author-info">
                                <img
                                    src={post.author_avatar || `https://ui-avatars.com/api/?name=${post.author_name || '익명'}&background=random`}
                                    alt={post.author_name || '익명'}
                                    className="author-avatar small"
                                />
                                <div className="author-details">
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{post.author_name || '익명'}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{timeAgo}</span>
                                </div>
                            </div>
                            {/* Edit/Delete Buttons */}
                            {user && user.id === post.user_id && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => { onClose(); onEdit && onEdit(post); }}
                                        style={{
                                            background: '#f3f4f6',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.85rem',
                                            color: '#4b5563'
                                        }}
                                    >
                                        <FaEdit size={14} /> 수정
                                    </button>
                                    <button
                                        onClick={() => { onDelete && onDelete(post.id); onClose(); }}
                                        style={{
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.85rem',
                                            color: '#dc2626'
                                        }}
                                    >
                                        <FaTrash size={14} /> 삭제
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="scrollable-content" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                            {post.title && <h2 className="detail-title" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: '#111827' }}>{post.title}</h2>}

                            <p className="detail-text" style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#374151', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                                {post.content || post.body}
                            </p>

                            {/* 미디어 섹션: 본문 바로 아래 배치 */}
                            {mediaList.length > 0 && (
                                <div className="detail-media-section" style={{ width: '100%', marginBottom: '24px' }}>
                                    <div className="media-carousel" style={{ height: 'auto', minHeight: '300px', maxHeight: '500px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                                        {((typeof mediaList[currentMediaIndex] === 'string' && (mediaList[currentMediaIndex].endsWith('.mp4') || mediaList[currentMediaIndex].endsWith('.webm'))) || mediaList[currentMediaIndex].type === 'video') ? (
                                            <video src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} controls className="detail-media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <img src={typeof mediaList[currentMediaIndex] === 'string' ? mediaList[currentMediaIndex] : mediaList[currentMediaIndex].url} alt="Post media" className="detail-media" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        )}

                                        {mediaList.length > 1 && (
                                            <>
                                                <button className="carousel-btn prev" onClick={handlePrevMedia} style={{ left: '10px' }}>&lt;</button>
                                                <button className="carousel-btn next" onClick={handleNextMedia} style={{ right: '10px' }}>&gt;</button>
                                                <div className="carousel-indicators">
                                                    {mediaList.map((_, idx) => (
                                                        <span key={idx} className={`indicator ${idx === currentMediaIndex ? 'active' : ''}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

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
                            </div>

                            <div className="comments-section" style={{ marginTop: '16px' }}>
                                <h5 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>댓글 {comments.length}개</h5>
                                {loadingComments ? (
                                    <p className="loading-text" style={{ textAlign: 'center', color: '#9ca3af' }}>댓글 로딩 중...</p>
                                ) : (
                                    <div className="comments-list">
                                        {comments.filter(c => !c.parent_id).map(comment => (
                                            <div key={comment.id} className="comment-group" style={{ marginBottom: '1.5rem' }}>
                                                <div className="comment-item" style={{ display: 'flex', gap: '12px' }}>
                                                    <img
                                                        src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name || '익명'}&background=random`}
                                                        alt={comment.author_name || '익명'}
                                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div className="comment-main" style={{ flex: 1 }}>
                                                        <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                            <span className="comment-author" style={{ fontWeight: '600', fontSize: '0.95rem' }}>{comment.author_name || '익명'}</span>
                                                            <span className="comment-time" style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                                            </span>
                                                        </div>
                                                        <span className="comment-text" style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>{comment.content}</span>
                                                        <div className="comment-actions" style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                                                            <button className="reply-btn" style={{ fontSize: '0.85rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => { setReplyingTo({ id: comment.id, author_name: comment.author_name }); setTimeout(() => commentInputRef.current?.focus(), 100); }}>
                                                                답글달기
                                                            </button>
                                                            {user && user.id === comment.user_id && (
                                                                <button className="del-btn" style={{ fontSize: '0.85rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleDeleteComment(comment.id)}>
                                                                    삭제
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 답글 리스트 */}
                                                <div className="replies-list" style={{ marginLeft: '48px', marginTop: '12px', borderLeft: '2px solid #f3f4f6', paddingLeft: '16px' }}>
                                                    {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                        <div key={reply.id} className="comment-item reply" style={{ marginBottom: '12px', display: 'flex', gap: '10px' }}>
                                                            <img
                                                                src={reply.author_avatar || `https://ui-avatars.com/api/?name=${reply.author_name}&background=random`}
                                                                alt={reply.author_name}
                                                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                            <div className="comment-main" style={{ flex: 1 }}>
                                                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                                    <span className="comment-author" style={{ fontWeight: '600', fontSize: '0.9rem' }}>{reply.author_name}</span>
                                                                    <span className="comment-time" style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: ko })}
                                                                    </span>
                                                                </div>
                                                                <span className="comment-text" style={{ fontSize: '0.9rem', color: '#4b5563' }}>{reply.content}</span>
                                                                {user && user.id === reply.user_id && (
                                                                    <div className="comment-actions" style={{ marginTop: '4px' }}>
                                                                        <button className="del-btn" style={{ fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => handleDeleteComment(reply.id)}>
                                                                            삭제
                                                                        </button>
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

                        <div className="detail-footer" style={{ padding: '20px 24px', borderTop: '1px solid #f3f4f6', background: '#fff' }}>
                            {replyingTo && (
                                <div className="reply-hint" style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ color: '#3b82f6', fontSize: '0.85rem' }}>@{replyingTo.author_name}님에게 답글 남기는 중...</span>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                </div>
                            )}

                            <form className="comment-form" onSubmit={handleSubmitComment}>
                                <input
                                    ref={commentInputRef}
                                    type="text"
                                    placeholder={replyingTo ? "답글 달기..." : "댓글 달기..."}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                >
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
