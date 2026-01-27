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
  routeBadge
}) {
  const getTagStyle = (tag) => {
      // Default to neutral
      let bg = 'rgba(255, 255, 255, 0.9)';
      let color = '#333';
      let icon = '✨';

      if (tag === '액티비티') {
          bg = 'rgba(59, 130, 246, 0.95)'; // Blue
          color = '#fff';
          icon = '🏃';
      } else if (tag === '맛집') {
          bg = 'rgba(239, 68, 68, 0.95)'; // Red
          color = '#fff';
          icon = '🍽️';
      } else if (tag === '힐링') {
          bg = 'rgba(16, 185, 129, 0.95)'; // Green
          color = '#fff';
          icon = '🌿';
      }

      return {
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: bg,
          color: color,
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
      };
  };

  return (
    <motion.div 
        className="rec-card"
        onClick={onClick}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
    >
      <div className="rec-image-container">
        <img src={image} alt={title} className="rec-image" />
        
        {/* ✅ AI Match Badge (Left) */}
        <div className="rec-badge">
            AI 매칭 {matchScore}%
        </div>

        {/* ✅ Top-Right Category Badge */}
        {tag && (
            <div style={getTagStyle(tag)}>
                <span>{tag === '액티비티' ? '🪂' : tag === '맛집' ? '🍽️' : '🌿'}</span>
                <span>{tag}</span>
            </div>
        )}

        <div className="rec-actions">
            <button className="rec-action-btn"><FiHeart /></button>
            <button className="rec-action-btn"><FiBookmark /></button>
        </div>

        {/* Route Order Badge */}
        {routeBadge && (
            <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: routeBadge.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: '800',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 10
            }}>
                {routeBadge.number}
            </div>
        )}
      </div>

      <div className="rec-info">
        <div className="rec-header">
            <h3 className="rec-title">{title}</h3>
            {/* Tag moved to top-right of image */}
        </div>
        <div className="rec-country">{country || "대한민국"}</div>
        <div className="rec-desc">{desc || "AI가 분석한 최적의 코스입니다."}</div>
      </div>
    </motion.div>
  );
}
