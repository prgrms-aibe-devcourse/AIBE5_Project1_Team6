import React from 'react';
import '../styles/LoadingOverlay.css';

export default function LoadingOverlay({ message = "열심히 여행지를 찾는 중이에요!", icon = "✈️", direction = "left" }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-icon-wrapper">
          <div className="pulse-ring"></div>
          <div className={`moving-icon ${direction === 'right' ? 'from-right' : ''}`}>{icon}</div>
        </div>
        <div className="loading-text">{message}</div>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}
