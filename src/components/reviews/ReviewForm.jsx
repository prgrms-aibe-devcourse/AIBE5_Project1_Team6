import { useState, useEffect } from 'react';
import { FaStar, FaPlus, FaTrash } from 'react-icons/fa';

export default function ReviewForm({ initialData, onSubmit, onClose }) {
    const [formData, setFormData] = useState({
        destination: '',
        rating: 5,
        content: '',
        media: [] // [{ url: '', type: 'image' }]
    });

    // 새 미디어 입력 상태
    const [newMediaUrl, setNewMediaUrl] = useState('');
    const [newMediaType, setNewMediaType] = useState('image');

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

    const handleAddMedia = () => {
        if (!newMediaUrl.trim()) return;
        setFormData(prev => ({
            ...prev,
            media: [...prev.media, { url: newMediaUrl, type: newMediaType }]
        }));
        setNewMediaUrl('');
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
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={newMediaUrl}
                                onChange={(e) => setNewMediaUrl(e.target.value)}
                                placeholder="URL 입력 (이미지/동영상)"
                            />
                            <select
                                className="form-select"
                                style={{ width: '100px' }}
                                value={newMediaType}
                                onChange={(e) => setNewMediaType(e.target.value)}
                            >
                                <option value="image">이미지</option>
                                <option value="video">동영상</option>
                            </select>
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
                                <div key={idx} style={{ position: 'relative', minWidth: '80px', height: '80px' }}>
                                    {item.type === 'video' ? (
                                        <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: '0.8rem' }}>Video</div>
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
