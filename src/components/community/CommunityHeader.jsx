import React from 'react';
import { FaPlus, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function CommunityHeader({ activeCategory, onCategoryChange, onWriteClick }) {
    const navigate = useNavigate();

    return (
        <div className="community-header-container" style={{ textAlign: 'center', position: 'relative', padding: '40px 20px 20px' }}>
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                }}
            >
                <FaChevronLeft /> 돌아가기
            </button>


            {/* Title & Subtitle */}
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#1f2937' }}>여행 Talk</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '32px' }}>여행 이야기를 나눠요</p>

            {/* Tab Switcher */}
            <div style={{
                display: 'inline-flex',
                background: 'white',
                padding: '6px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6'
            }}>
                <button
                    onClick={() => onCategoryChange('free')}
                    style={{
                        padding: '12px 32px',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeCategory === 'free' ? '#3b82f6' : 'transparent',
                        color: activeCategory === 'free' ? 'white' : '#6b7280',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    자유게시판
                </button>
                <button
                    onClick={() => onCategoryChange('review')}
                    style={{
                        padding: '12px 32px',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeCategory === 'review' ? '#3b82f6' : 'transparent',
                        color: activeCategory === 'review' ? 'white' : '#6b7280',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    여행 후기
                </button>
            </div>
        </div>
    );
}
