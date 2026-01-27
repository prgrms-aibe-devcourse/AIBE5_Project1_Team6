import React from 'react';

export default function Skeleton({ width, height, borderRadius = '12px', style }) {
    return (
        <div 
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s infinite',
                ...style
            }}
        />
    );
}

// Add keyframes to a global style or insert here
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;
document.head.appendChild(styleSheet);
