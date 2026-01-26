import { useState, useEffect, useRef } from 'react';
import { FaStar, FaPlus, FaTrash, FaFolderOpen } from 'react-icons/fa';

export default function ReviewForm({ initialData, onSubmit, onClose }) {
    const [formData, setFormData] = useState({
        destination: '',
        rating: 5,
        content: '',
        media: [] // [{ url: '', type: 'image' }]
    });

    // 새 미디어 입력 상태
    const [newMediaUrl, setNewMediaUrl] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                destination: initialData.destination,
                rating: initialData.rating,
                content: initialData.content,
                media: initialData.media || []
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
                media: [...prev.media, { url: result, type }]
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initialData ? '후기 수정' : '후기 작성'}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>여행지</label>
                        <input
                            type="text"
                            name="destination"
                            className="form-input"
                            value={formData.destination}
                            onChange={handleChange}
                            placeholder="예: 제주도, 파리"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>평점</label>
                        <div style={{ display: 'flex', gap: 5 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                    key={star}
                                    size={24}
                                    color={star <= formData.rating ? "#fbbf24" : "#4b5563"}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>내용</label>
                        <textarea
                            name="content"
                            className="form-textarea"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="여행 후기를 자유롭게 작성해주세요."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>이미지/동영상 추가</label>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,video/*"
                            style={{ display: 'none' }}
                        />

                        {/* URL 입력 및 파일 추가 */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={newMediaUrl}
                                onChange={(e) => setNewMediaUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); // 폼 제출 방지
                                        handleAddMedia();
                                    }
                                }}
                                placeholder="URL을 입력하거나 + 버튼을 눌러 파일 업로드"
                            />
                            <button
                                type="button"
                                onClick={handleAddMedia}
                                className="action-btn"
                                style={{ background: '#3b82f6', color: 'white', padding: '0 1rem', borderRadius: 8 }}
                            >
                                <FaPlus />
                            </button>
                        </div>

                        {/* 추가된 미디어 목록 */}
                        <div className="media-preview-list" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                            {formData.media.map((item, idx) => (
                                <div key={idx} style={{ position: 'relative', minWidth: '80px', height: '80px', flexShrink: 0 }}>
                                    {item.type === 'video' ? (
                                        <video
                                            src={item.url}
                                            muted
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                                        />
                                    ) : (
                                        <img src={item.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(idx)}
                                        style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="action-btn" style={{ background: '#444', padding: '0.8rem 1.5rem', borderRadius: 8 }}>취소</button>
                        <button type="submit" className="action-btn" style={{ background: '#3b82f6', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 8 }}>저장하기</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
