import { useState } from 'react';
import { FaStar, FaHeart, FaRegHeart, FaComment, FaTrash, FaEdit, FaLayerGroup } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ReviewCard({ review, currentUser, onLike, onDelete, onEdit, onClick }) {
    const [imgError, setImgError] = useState(false);

    // 날짜 포맷팅
    const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ko });

    // 첫 번째 미디어 가져오기
    const firstMedia = review.media && review.media.length > 0 ? review.media[0] : null;
    const mediaCount = review.media ? review.media.length : 0;

    return (
        <div className="review-card" onClick={() => onClick(review)} style={{ cursor: 'pointer' }}>
            <div className="review-header">
                <img
                    src={review.author_avatar || `https://ui-avatars.com/api/?name=${review.author_name}`}
                    alt={review.author_name}
                    className="author-avatar"
                />
                <div className="review-info">
                    <h4>{review.author_name}</h4>
                    <span className="review-date">{timeAgo}</span>
                </div>
                <span className="review-destination">{review.destination}</span>
            </div>

            {/* 미디어 썸네일 */}
            {firstMedia && (
                <div className="review-media-container" style={{ position: 'relative' }}>
                    {firstMedia.type === 'video' ? (
                        <video src={firstMedia.url} className="review-media" />
                    ) : (
                        <img
                            src={imgError ? 'https://via.placeholder.com/600x400?text=No+Image' : firstMedia.url}
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
                <p className="review-text">{review.content}</p>
            </div>

            <div className="review-footer" onClick={(e) => e.stopPropagation()}>
                <div className="review-actions">
                    <button className={`action-btn ${review.is_liked ? 'liked' : ''}`} onClick={() => onLike(review.id)}>
                        {review.is_liked ? <FaHeart /> : <FaRegHeart />}
                        <span>{review.likes}</span>
                    </button>
                    <button className="action-btn">
                        <FaComment />
                        <span>{review.comments}</span>
                    </button>
                </div>

                {/* 본인 글일 경우 수정/삭제 버튼 */}
                {currentUser && (currentUser.id === review.user_id || review.user_id.startsWith('mock-')) && (
                    <div className="review-actions">
                        <button className="action-btn" onClick={() => onEdit(review)}>
                            <FaEdit />
                        </button>
                        <button className="action-btn" onClick={() => onDelete(review.id)}>
                            <FaTrash />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
