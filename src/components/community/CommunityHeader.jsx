import React from 'react';
import { FaPlus } from 'react-icons/fa';

export default function CommunityHeader({ activeCategory, onCategoryChange, onWriteClick }) {

    return (
        <div className="community-header-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px 20px',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%'
        }}>

            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: '#1f2937' }}>여행 Talk</h1>
                <p style={{ 
                    color: '#6b7280', 
                    fontSize: '1.2rem', 
                    margin: '8px 0 0 0', 
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontWeight: '500',
                    letterSpacing: '-0.02em'
                }}>여행 이야기를 나눠요</p>
            </div>

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
