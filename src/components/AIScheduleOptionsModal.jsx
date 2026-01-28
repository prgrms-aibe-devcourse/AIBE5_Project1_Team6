import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import '../styles/aiModal.css';

const STYLE_OPTIONS = [
    { id: "nature", emoji: "🏞️", label: "자연", desc: "산과 바다, 힐링 여행" },
    { id: "city", emoji: "🏙️", label: "도심", desc: "쇼핑과 핫플레이스" },
    { id: "food", emoji: "🍜", label: "맛집탐방", desc: "미식가를 위한 여행" },
    { id: "culture", emoji: "🎨", label: "문화체험", desc: "예술과 역사 탐방" },
    { id: "relax", emoji: "🛀", label: "휴식", desc: "온전한 호캉스와 여유" },
    { id: "activity", emoji: "🏄", label: "액티비티", desc: "신나는 레저 활동" },
];

export default function AIScheduleOptionsModal({ 
    open, 
    onClose, 
    onGenerate, 
    initialPlace, 
    savedPlaces = [] 
}) {
    const [step, setStep] = useState(1);
    const [nights, setNights] = useState(2);
    const [people, setPeople] = useState(1);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [selectedMood, setSelectedMood] = useState(null); // 'burnout' | etc
    const [selectedStyle, setSelectedStyle] = useState(null); // 'nature' | etc
    const [selectedBudgetLevel, setSelectedBudgetLevel] = useState(null); // 'low' | 'mid' | 'high'
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [userPrompt, setUserPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Mood options
    const moodOptions = [
        { key: 'burnout', label: '번아웃', emoji: '😫', color: '#ef4444' },
        { key: 'energy', label: '활력 충전', emoji: '🌟', color: '#f59e0b' },
        { key: 'healing', label: '힐링', emoji: '🧘', color: '#10b981' },
        { key: 'adventure', label: '모험', emoji: '🎒', color: '#8b5cf6' }
    ];

    useEffect(() => {
        if (open) {
            setStep(1);
            if (initialPlace) {
                // Check if already in generic selected list or explicitly set it
                setSelectedPlaces(prev => {
                     const exists = prev.some(p => p.id === initialPlace.id);
                     return exists ? prev : [initialPlace, ...prev];
                });
            }
        }
    }, [open, initialPlace]);

    const availablePlaces = useMemo(() => {
        const selectedIds = new Set(selectedPlaces.map(p => p.id));
        return savedPlaces.filter(p => !selectedIds.has(p.id));
    }, [savedPlaces, selectedPlaces]);

    if (!open) return null;

    // Handlers
    const handleNext = () => {
        if (step < 6) setStep(step + 1);
    };

    const handlePrev = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            onClose(); // Close on first step back? Or just nothing? Usually close or stay. 
                       // User might expect back to close if step 1. But let's keep it safe.
        }
    };

    const handleAddPlace = (place) => {
        setSelectedPlaces(prev => [...prev, place]);
    };

    const handleRemovePlace = (placeId) => {
        setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
    };

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        try {
            await onGenerate({
                nights,
                places: selectedPlaces,
                userPrompt,
                people,
                startDate, // Pass custom start date
                mood: selectedMood,
                style: selectedStyle?.id,
                budgetLevel: selectedBudgetLevel // Pass budget level
            });
            // Don't close here, parent usually handles or loader shows
        } catch (e) {
            console.error(e);
            setIsGenerating(false);
        }
    };

    // calculate progress: step 1=16%, ... step 6=100%
    const progressPercent = (step / 6) * 100;

    return createPortal(
        <div className="ai-modal-overlay">
            <motion.div 
                className="ai-modal-container"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
                {/* Header */}
                <div className="ai-modal-header">
                    <h3>✨ AI 맞춤 일정 생성</h3>
                    <p>몇 가지 질문에 답하면 30초 만에 일정이 완성돼요.</p>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="ai-modal-body">
                    {/* Progress Bar */}
                    <div className="ai-progress-bar">
                        <div 
                            className="ai-progress-fill" 
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="step-indicator">
                        Step {step} / 6
                    </div>

                    {/* Step 1: Mood */}
                    {step === 1 && (
                        <div className="modal-section fadeIn">
                            <h4>💭 지금 당신의 상태는?</h4>
                            <div className="ai-options-grid">
                                {moodOptions.map((mood) => (
                                    <button
                                        key={mood.key}
                                        type="button"
                                        className={`ai-option-card ${selectedMood === mood.key ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedMood(mood.key);
                                            // setTimeout(handleNext, 300); // Auto advance 제거
                                        }}
                                    >
                                        <div className="ai-option-emoji">{mood.emoji}</div>
                                        <div className="ai-option-label">{mood.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Places */}
                    {step === 2 && (
                        <div className="modal-section fadeIn">
                            <h4>📍 포함할 장소 ({selectedPlaces.length})</h4>
                            <div className="places-container">
                                {/* Selected */}
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
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="place-chip active"
                                            >
                                                <span className="chip-text">{place.title}</span>
                                                <button onClick={() => handleRemovePlace(place.id)}>✕</button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Available */}
                                <div className="places-list available-list">
                                    <span className="list-label">저장된 장소 추가하기</span>
                                    <div className="chips-grid">
                                        {availablePlaces.length === 0 ? (
                                            <div className="empty-placeholder text-muted" style={{ padding: '4px' }}>추가할 장소가 없습니다</div>
                                        ) : (
                                            availablePlaces.map(place => (
                                                <button 
                                                    key={place.id}
                                                    className="place-chip available"
                                                    onClick={() => handleAddPlace(place)}
                                                >
                                                    + {place.title}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Style */}
                    {step === 3 && (
                        <div className="modal-section fadeIn">
                            <h4>🎨 선호하는 여행 스타일은?</h4>
                            <div className="ai-options-grid">
                                {STYLE_OPTIONS.map((style) => (
                                    <button
                                        key={style.id}
                                        type="button"
                                        className={`ai-option-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedStyle(style);
                                            // setTimeout(handleNext, 300); // Auto advance 제거
                                        }}
                                    >
                                        <div className="ai-option-emoji">{style.emoji}</div>
                                        <div className="ai-option-label">{style.label}</div>
                                        <div className="ai-option-desc">{style.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Budget */}
                    {step === 4 && (
                        <div className="modal-section fadeIn">
                            <h4>💰 예산은 어느 정도 생각하시나요?</h4>
                            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                {[
                                    { level: 'low', label: '가성비', sub: '합리적으로', emoji: '💰' },
                                    { level: 'mid', label: '적당히', sub: '밸런스 있게', emoji: '💎' },
                                    { level: 'high', label: '럭셔리', sub: '여유있게', emoji: '✨' }
                                ].map((opt) => (
                                    <button
                                        key={opt.level}
                                        type="button"
                                        className={`ai-option-card ${selectedBudgetLevel === opt.level ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedBudgetLevel(opt.level);
                                            // setTimeout(handleNext, 300); // 사용자 요청으로 자동 넘기기 제거
                                        }}
                                        style={{ width: 'calc(50% - 8px)', minWidth: '140px' }}
                                    >
                                        <div className="ai-option-emoji">{opt.emoji}</div>
                                        <div className="ai-option-label">{opt.label}</div>
                                        <div className="ai-option-desc">{opt.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Details */}
                    {step === 5 && (
                        <div className="modal-section fadeIn">
                            <h4>📅 인원 및 기간 설정</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: '600', color: '#333' }}>👥 인원</span>
                                    <div className="duration-selector" style={{ width: 'auto', padding: '4px', boxShadow: 'none', background: 'transparent' }}>
                                        <button className="circle-btn" onClick={() => setPeople(Math.max(1, people - 1))} disabled={people <= 1}>-</button>
                                        <span className="duration-text">{people}명</span>
                                        <button className="circle-btn" onClick={() => setPeople(Math.min(20, people + 1))} disabled={people >= 20}>+</button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: '600', color: '#333' }}>📅 출발 날짜</span>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ 
                                            border: 'none', 
                                            background: 'transparent', 
                                            padding: '4px 8px', 
                                            fontSize: '1.1rem',
                                            color: '#3b82f6',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                            textAlign: 'right'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                    <span style={{ fontWeight: '600', color: '#333' }}>🗓️ 여행 기간</span>
                                    <div className="duration-selector" style={{ width: 'auto', padding: '4px', boxShadow: 'none', background: 'transparent' }}>
                                        <button className="circle-btn" onClick={() => setNights(Math.max(0, nights - 1))} disabled={nights <= 0}>-</button>
                                        <span className="duration-text">{nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`}</span>
                                        <button className="circle-btn" onClick={() => setNights(Math.min(10, nights + 1))} disabled={nights >= 10}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Prompt */}
                    {step === 6 && (
                        <div className="modal-section fadeIn">
                            <h4>✏️ 추가 요청사항이 있나요? (본인의 계획을 넣으셔도 무방합니다!)</h4>
                            <textarea
                                className="ai-request-input"
                                placeholder="예: 아이들과 가기 좋은 곳, 맛집 위주 일정, 걷기 좋은 코스 등..."
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                rows={5}
                                style={{ marginTop: '12px' }}
                            />
                        </div>
                    )}
                </div>

                <div className="ai-modal-footer">
                    {step > 1 && (
                        <button className="cancel-btn" onClick={handlePrev}>
                            이전
                        </button>
                    )}
                    
                    {step < 6 ? (
                        <button 
                            className="generate-btn" 
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedMood) || 
                                (step === 2 && selectedPlaces.length === 0) ||
                                (step === 3 && !selectedStyle) ||
                                (step === 4 && !selectedBudgetLevel)
                            }
                            style={{ background: '#3b82f6' }}
                        >
                            다음
                        </button>
                    ) : (
                        <button 
                            className="generate-btn" 
                            onClick={handleGenerateClick}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'AI가 일정 생성 중...' : '✨ 30초 만에 일정 완성하기'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
