import { useState, useEffect, useRef } from 'react';
import { FaStar, FaPlus, FaTrash, FaFolderOpen } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ReviewForm({ initialData, onSubmit, onClose, category = 'review' }) {
    const isReview = category === 'review';
    const [formData, setFormData] = useState({
        destination: '',
        rating: 5,
        title: '',
        content: '',
        media: [],
        mood: '',
        theme: ''
    });

    // 새 미디어 입력 상태
    const [newMediaUrl, setNewMediaUrl] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                destination: initialData.destination,
                rating: initialData.rating,
                title: initialData.title || '',
                content: initialData.content,
                media: initialData.media || [],
                mood: initialData.mood || '',
                theme: initialData.theme || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 파일 입력 참조
    const fileInputRef = useRef(null);

    // 파일 선택 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            const type = file.type.startsWith('image/') ? 'image' : 'video';

            setFormData(prev => ({
                ...prev,
                media: [...prev.media, { url: result, type, file: file }] // file 객체 저장
            }));
        };
        reader.readAsDataURL(file);

        // 입력 초기화 (같은 파일 다시 선택 가능하도록)
        e.target.value = '';
    };

    const handleAddMedia = () => {
        if (newMediaUrl.trim()) {
            // URL 확장자로 타입 추론 (기본값: image)
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(newMediaUrl);
            const type = isVideo ? 'video' : 'image';

            setFormData(prev => ({
                ...prev,
                media: [...prev.media, { url: newMediaUrl, type }]
            }));
            setNewMediaUrl('');
        } else {
            fileInputRef.current.click();
        }
    };

    const handleRemoveMedia = (index) => {
        setFormData(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <motion.div
            className="modal-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <motion.div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                    background: 'white', width: '90%', maxWidth: '580px', // Wider
                    borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    padding: 0 // Force Remove Padding
                }}
            >
                {/* 🎨 Redesigned Blue Header */}
                <div style={{
                    background: '#3b82f6',
                    padding: '24px 28px', // Slightly more horizontal padding
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {initialData ? (isReview ? '여행 후기 수정' : '게시글 수정') : (isReview ? '여행 후기 글쓰기' : '자유게시판 글쓰기')}
                    </h3>
                    {/* Close Button (X) */}
                    <div
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: '8px', borderRadius: '12px',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        <FaPlus size={18} style={{ transform: 'rotate(45deg)' }} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '80vh', overflowY: 'auto' }}>

                    {/* Travel specific fields */}
                    {isReview && (
                        <>
                            {/* Destination */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>여행지</label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    placeholder="예: 제주도, 발리, 도쿄"
                                    required={isReview}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '16px',
                                        border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '1rem',
                                        outline: 'none', fontFamily: 'inherit', color: '#111'
                                    }}
                                />
                            </div>

                            {/* Rating */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>별점</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FaStar
                                            key={star}
                                            size={36}
                                            color={star <= formData.rating ? "#fbbf24" : "#e5e7eb"}
                                            style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Title (Added per Request & Image) */}
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>제목</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="제목을 입력하세요"
                            required
                            style={{
                                width: '100%', padding: '16px', borderRadius: '16px',
                                border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '1rem',
                                outline: 'none', fontFamily: 'inherit', color: '#111'
                            }}
                        />
                    </div>

                    {/* Content */}
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>내용</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="내용을 입력하세요"
                            required
                            style={{
                                width: '100%', padding: '16px', borderRadius: '16px', minHeight: '160px',
                                border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '1rem',
                                outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#111', lineHeight: '1.6'
                            }}
                        />
                    </div>

                    {/* Mood */}
                    {isReview && (
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>여행 무드</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'romantic', label: '🌹 낭만' },
                                    { id: 'refresh', label: '🌈 리프레시' },
                                    { id: 'active', label: '👟 에너지' },
                                    { id: 'calm', label: '🤫 고요' }
                                ].map((mood) => (
                                    <button
                                        key={mood.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, mood: mood.id }))}
                                        style={{
                                            padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600',
                                            border: formData.mood === mood.id ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                                            background: formData.mood === mood.id ? '#eff6ff' : 'white',
                                            color: formData.mood === mood.id ? '#3b82f6' : '#6b7280',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {mood.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Theme */}
                    {isReview && (
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>여행 테마</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'activity', label: '🏃 액티비티' },
                                    { id: 'food', label: '🍽️ 맛집' },
                                    { id: 'healing', label: '🌿 힐링' }
                                ].map((theme) => (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                                        style={{
                                            padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600',
                                            border: formData.theme === theme.id ? '1px solid #10b981' : '1px solid #e5e7eb',
                                            background: formData.theme === theme.id ? '#d1fae5' : 'white',
                                            color: formData.theme === theme.id ? '#059669' : '#6b7280',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {theme.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media */}
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>사진/동영상</label>

                        {/* URL 입력 필드 */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                value={newMediaUrl}
                                onChange={(e) => setNewMediaUrl(e.target.value)}
                                placeholder="이미지/동영상 URL 입력"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddMedia();
                                    }
                                }}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.9rem',
                                    outline: 'none', fontFamily: 'inherit', color: '#111'
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddMedia}
                                style={{
                                    padding: '12px 16px', borderRadius: '12px', border: 'none',
                                    background: '#3b82f6', color: 'white', fontWeight: 'bold',
                                    cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap'
                                }}
                            >
                                추가
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {/* Upload Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    width: '80px', height: '80px', borderRadius: '12px', border: '1px dashed #d1d5db',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                                    background: '#f9fafb', cursor: 'pointer', flexShrink: 0, gap: '4px', fontSize: '0.7rem'
                                }}
                            >
                                <FaPlus size={16} />
                                <span>파일</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,video/*"
                                style={{ display: 'none' }}
                            />

                            {/* Previews */}
                            {formData.media.map((item, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                    {item.type === 'video' ? (
                                        <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                    ) : (
                                        <img src={item.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(idx)}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            background: '#ef4444', color: 'white', border: 'none',
                                            borderRadius: '50%', width: '20px', height: '20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                            💡 URL로 추가하거나 파일 버튼으로 업로드하세요. (파일 업로드는 미리보기만 가능)
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                                background: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
                                background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            등록하기
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
