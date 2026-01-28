import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import '../styles/aiModal.css'; // We'll create this css file

export default function AIScheduleOptionsModal({ 
    open, 
    onClose, 
    onGenerate, 
    initialPlace, 
    savedPlaces = [] 
}) {
    // 1박 2일 ~ 6박 7일 (default 2 nights)
    const [nights, setNights] = useState(2);
    // User selected places (starts with the initial place)
    const [selectedPlaces, setSelectedPlaces] = useState(initialPlace ? [initialPlace] : []);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter out already selected places from the savedPlaces list
    const availablePlaces = useMemo(() => {
        const selectedIds = new Set(selectedPlaces.map(p => p.id));
        return savedPlaces.filter(p => !selectedIds.has(p.id));
    }, [savedPlaces, selectedPlaces]);

    if (!open) return null;

    const handleAddPlace = (place) => {
        setSelectedPlaces(prev => [...prev, place]);
    };

    const handleRemovePlace = (placeId) => {
        // Cannot remove the initial place if we want to enforce it? 
        // Let's allow removing any, but maybe warn if empty?
        // Actually, user might want to focus on another place.
        setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
    };

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        // Call parent handler
        await onGenerate({
            nights,
            places: selectedPlaces
        });
        setIsGenerating(false);
    };

    return createPortal(
        <div className="ai-modal-overlay">
            <motion.div 
                className="ai-modal-container"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
            >
                <div className="ai-modal-header">
                    <h3>✨ AI 맞춤 일정 생성</h3>
                    <p>여행 기간과 방문하고 싶은 장소를 선택해주세요.</p>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="ai-modal-body">
                    {/* 1. Duration Section */}
                    <section className="modal-section">
                        <h4>📅 여행 기간</h4>
                        <div className="duration-selector">
                            <button 
                                className="circle-btn" 
                                onClick={() => setNights(Math.max(1, nights - 1))}
                                disabled={nights <= 1}
                            >-</button>
                            <span className="duration-text">
                                {nights}박 {nights + 1}일
                            </span>
                            <button 
                                className="circle-btn" 
                                onClick={() => setNights(Math.min(6, nights + 1))}
                                disabled={nights >= 6}
                            >+</button>
                        </div>
                    </section>

                    {/* 2. Places Section (Drag & Drop mock - click to move) */}
                    <section className="modal-section">
                        <h4>📍 포함할 장소 ({selectedPlaces.length}개)</h4>
                        <div className="places-container">
                            {/* Selected Places (Left/Top) */}
                            <div className="places-list selected-list">
                                <span className="list-label">선택된 장소 (필수 방문)</span>
                                {selectedPlaces.length === 0 && (
                                    <div className="empty-placeholder">장소를 추가해주세요</div>
                                )}
                                <AnimatePresence>
                                    {selectedPlaces.map(place => (
                                        <motion.div 
                                            key={place.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="place-chip active"
                                        >
                                            <span className="chip-text">{place.title}</span>
                                            <button onClick={() => handleRemovePlace(place.id)}>✕</button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Available Places (Right/Bottom) */}
                            <div className="places-list available-list">
                                <span className="list-label">저장된 장소 추가하기</span>
                                {availablePlaces.length === 0 && (
                                    <div className="empty-placeholder text-muted">추가할 장소가 없습니다</div>
                                )}
                                <div className="chips-grid">
                                    {availablePlaces.map(place => (
                                        <motion.button 
                                            key={place.id}
                                            layout
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="place-chip available"
                                            onClick={() => handleAddPlace(place)}
                                        >
                                            + {place.title}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="ai-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>취소</button>
                    <button 
                        className="generate-btn" 
                        onClick={handleGenerateClick}
                        disabled={isGenerating || selectedPlaces.length === 0}
                    >
                        {isGenerating ? 'AI가 일정 생성 중...' : '✨ 1초 만에 일정 완성하기'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
