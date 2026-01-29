import { FiHeart, FiBookmark } from "react-icons/fi";
import { motion } from "framer-motion";
import "../styles/RecommendationCard.css";

export default function RecommendationCard({
  image,
  title,
  country,
  tag,
  desc,
  matchScore = 95,
  onClick,
  onSave,
  onLike,
  isLiked = false,
  isRegistered = false,
  action, // New prop for hover actions
  showMatchScore = true
}) {
  return (
    <motion.div
      className="rec-card"
      onClick={onClick}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="rec-image-container">
        <img src={image} alt={title} className="rec-image" />

        {showMatchScore && (
          <div className="rec-badge">
            AI 매칭 {matchScore}%
          </div>
        )}

        <div className="rec-actions">
          {onLike && (
          <button 
            className="rec-action-btn like-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            title={isLiked ? "좋아요 취소" : "좋아요"}
            style={{ 
                color: '#ef4444',
                transition: 'all 0.2s ease'
            }}
          >
            {isLiked ? <FiHeart style={{ fill: '#ef4444', stroke: '#ef4444' }} /> : <FiHeart style={{ stroke: '#ef4444' }} />}
          </button>
          )}
          
          {onSave && (
              <button 
                className="rec-action-btn bookmark-btn"
                onClick={(e) => {
                e.stopPropagation();
                onSave();
                }}
                title={isRegistered ? "저장 취소" : "장소 저장"}
                style={{ 
                    color: '#10B981',
                    transition: 'all 0.2s ease',
                    marginLeft: '8px'
                }}
            >
                {isRegistered ? <FiBookmark style={{ fill: '#10B981', stroke: '#10B981' }} /> : <FiBookmark style={{ stroke: '#10B981' }} />}
            </button>
          )}
        </div>
        
        {isRegistered && (
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: '#10B981', // Green
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                등록된 장소
            </div>
        )}

        {/* Hover Action (AI Create Schedule Button) */}
        {action && (
            <div 
                className="rec-hover-action"
                onClick={(e) => {
                    e.stopPropagation();
                    action.onClick?.();
                }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: 0, // Initially hidden
                    transform: 'translateY(100%)', // Slide up effect
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 20
                }}
            >
                <button
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        justifyContent: 'center'
                    }}
                >
                    {action.label || "Action"}
                </button>
            </div>
        )}
      </div>
      <div className="rec-info">
        <div className="rec-header">
          <h3 className="rec-title">{title}</h3>
          {tag && <span className="rec-tag" data-tag={tag}>{tag}</span>}
        </div>
        <div className="rec-country">{country || "대한민국"}</div>
        <div className="rec-desc">{desc}</div>
      </div>
    </motion.div>
  );
}
