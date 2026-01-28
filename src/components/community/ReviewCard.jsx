import { useState } from 'react';
import { FaStar, FaHeart, FaRegHeart, FaComment, FaTrash, FaEdit, FaLayerGroup } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ReviewCard({ review, currentUser, onLike, onDelete, onEdit, onClick }) {
    const [imgError, setImgError] = useState(false);

    // 날짜 포맷팅
    const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 첫 번째 미디어 가져오기
    const firstMedia = review.media && review.media.length > 0 ? review.media[0] : null;
    const mediaCount = review.media ? review.media.length : 0;

    return (
        <div className="review-card" onClick={() => onClick(review)} style={{ cursor: 'pointer' }}>
            <div className="review-header">
                <img
                    src={review.author_avatar || `https://ui-avatars.com/api/?name=${review.author_name || '익명'}&background=3b82f6&color=fff`}
                    alt={review.author_name || '익명'}
                    className="author-avatar"
                />
                <div className="review-info">
                    <h4>{review.author_name || '익명'}</h4>
                    <span className="review-date">{timeAgo}</span>
                </div>
                <span className="review-destination">{review.destination}</span>
            </div>

            {/* 미디어 썸네일 */}
            {firstMedia && (
                <div className="review-media-container" style={{ position: 'relative' }}>
                    {(typeof firstMedia === 'string' && (firstMedia.endsWith('.mp4') || firstMedia.endsWith('.webm'))) || firstMedia.type === 'video' ? (
                        <video src={typeof firstMedia === 'string' ? firstMedia : firstMedia.url} className="review-media" />
                    ) : (
                        <img
                            src={imgError ? 'https://via.placeholder.com/600x400?text=No+Image' : (typeof firstMedia === 'string' ? firstMedia : firstMedia.url)}
                            alt="Review media"
                            className="review-media"
                            onError={() => setImgError(true)}
                        />
                    )}

                    {/* 여러 개일 경우 표시 */}
                    {mediaCount > 1 && (
                        <div className="media-count-badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FaLayerGroup /> +{mediaCount - 1}
                        </div>
                    )}
                </div>
            )}

            <div className="review-content">
                <div className="rating">
                    {[...Array(5)].map((_, i) => (
                        <FaStar key={i} color={i < review.rating ? "#fbbf24" : "#4b5563"} />
                    ))}
                </div>
                {/* 제목 추가 */}
                {review.title && (
                    <h3 className="review-title" style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        margin: '8px 0 4px 0',
                        lineHeight: '1.4'
                    }}>
                        {review.title}
                    </h3>
                )}
                <div className="wellness-tags" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                    {review.mood && (
                        <span className="wellness-tag mood" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '500' }}>
                            {review.mood === 'romantic' ? '🌹 낭만' :
                                review.mood === 'refresh' ? '🌈 리프레시' :
                                    review.mood === 'active' ? '👟 에너지 충전' : '🤫 고요한 휴식'}
                        </span>
                    )}
                    {review.themes?.map(theme => (
                        <span key={theme} className="wellness-tag theme" style={{ background: '#d1fae5', color: '#047857', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '500' }}>
                            {theme === 'activity' ? '🪂 액티비티' :
                                theme === 'food' ? '🍱 맛집 탐방' : '🌿 힐링/휴식'}
                        </span>
                    ))}
                </div>
                <p className="review-text">{review.content || review.body}</p>
            </div>

            <div
                className="review-footer"
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div className="review-actions">
                    <button className={`action-btn ${review.is_liked ? 'liked' : ''}`} onClick={() => onLike(review.id)}>
                        {review.is_liked ? <FaHeart /> : <FaRegHeart />}
                        <span>{review.likes}</span>
                    </button>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); onClick(review, true); }}>
                        <FaComment />
                        <span>{review.comments}</span>
                    </button>
                </div>

                {/* Edit/Delete Buttons */}
                {currentUser && currentUser.id === review.user_id && (
                    <div className="review-actions" style={{ position: 'relative' }}>
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
                                    onClick={(e) => { e.stopPropagation(); onDelete(review.id); }}
                                    style={{
                                        background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px',
                                        padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    예
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                                    style={{
                                        background: '#e5e7eb', color: '#4b5563', border: 'none', borderRadius: '4px',
                                        padding: '2px 8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'
                                    }}
                                >
                                    아니오
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); onEdit(review); }}>
                                    <FaEdit />
                                </button>
                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}>
                                    <FaTrash />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
