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
  onClick
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

        <div className="rec-badge">
          AI 매칭 {matchScore}%
        </div>

        <div className="rec-actions">
          <button className="rec-action-btn"><FiHeart /></button>
          <button className="rec-action-btn"><FiBookmark /></button>
        </div>
      </div>

      <div className="rec-info">
        <div className="rec-header">
          <h3 className="rec-title">{title}</h3>
          {tag && <span className="rec-tag" data-tag={tag}>{tag}</span>}
        </div>
        <div className="rec-country">{country || "대한민국"}</div>
        <div className="rec-desc">{desc || "AI가 분석한 최적의 코스입니다."}</div>
      </div>
    </motion.div>
  );
}
