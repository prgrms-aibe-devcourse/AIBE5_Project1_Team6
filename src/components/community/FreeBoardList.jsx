import React from 'react';
import { FaHeart, FaRegHeart, FaComment, FaEdit, FaTrash } from 'react-icons/fa';

export default function FreeBoardList({ posts, onPostClick, currentUser, onEdit, onDelete, onLike }) {
    return (
        <div className="free-board-list" style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map(post => (
                    <div
                        key={post.id}
                        onClick={() => onPostClick(post)}
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            border: '1px solid #f3f4f6'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                    >
                        {/* Author Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            {post.author_avatar ? (
                                <img
                                    src={post.author_avatar}
                                    alt={post.author_name || '익명'}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}>
                                    {(post.author_name || '익명').charAt(0)}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1f2937' }}>
                                    {post.author_name || '여행러버'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    약 {formatDate(post.created_at)} 전
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px', color: '#1f2937' }}>
                            {post.title}
                        </h3>
                        <p style={{
                            color: '#4b5563',
                            lineHeight: '1.6',
                            marginBottom: '20px',
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {post.body || post.content}
                        </p>

                        {/* Media Preview (If any) */}
                        {post.media && post.media.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {post.media.slice(0, 3).map((m, idx) => {
                                    const url = typeof m === 'string' ? m : m.url;
                                    const isVideo = (typeof m === 'string' && (m.endsWith('.mp4') || m.endsWith('.webm'))) || m.type === 'video';
                                    return (
                                        <div key={idx} style={{ width: '120px', height: '120px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid #f3f4f6' }}>
                                            {isVideo ? (
                                                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <img src={url} alt="post media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                            {idx === 2 && post.media.length > 3 && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                                    +{post.media.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Footer - Like ReviewCard style */}
                        <div
                            className="review-footer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid #f3f4f6',
                                paddingTop: '16px'
                            }}
                        >
                            <div className="review-actions" style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className={`action-btn ${post.is_liked ? 'liked' : ''}`}
                                    onClick={() => onLike && onLike(post.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: post.is_liked ? '#ef4444' : '#9ca3af',
                                        fontSize: '0.9rem',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {post.is_liked ? <FaHeart /> : <FaRegHeart />}
                                    <span>{post.like_count || post.likes || 0}</span>
                                </button>
                                <button
                                    className="action-btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#9ca3af',
                                        fontSize: '0.9rem',
                                        padding: '4px 8px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <FaComment />
                                    <span>{post.comment_count || post.comments || 0}</span>
                                </button>
                            </div>

                            {/* Edit/Delete Buttons - Only for post owner */}
                            {currentUser && currentUser.id === post.user_id && (
                                <div className="review-actions" style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        className="action-btn"
                                        onClick={() => onEdit(post)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#9ca3af',
                                            fontSize: '0.9rem',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="action-btn"
                                        onClick={() => onDelete(post.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#9ca3af',
                                            fontSize: '0.9rem',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Simple date formatter (relative time)
function formatDate(dateStr) {
    if (!dateStr) return '방금';
    const now = new Date();
    const past = new Date(dateStr);
    const diffInS = Math.floor((now - past) / 1000);

    if (diffInS < 60) return `${diffInS}초`;
    const diffInM = Math.floor(diffInS / 60);
    if (diffInM < 60) return `${diffInM}분`;
    const diffInH = Math.floor(diffInM / 60);
    if (diffInH < 24) return `${diffInH}시간`;
    const diffInD = Math.floor(diffInH / 24);
    return `${diffInD}일`;
}
