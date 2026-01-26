import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/mypage.css';
import { useQuery } from '@tanstack/react-query';
import { loadPlans } from '../services/plansStorage';
import TravelBiorhythm from '../components/TravelBiorhythm';

export default function MyPage() {
    const { user, setUser } = useAuthStore();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState('schedules');

    // Profile State
    const [profileName, setProfileName] = useState('');
    const [profileDesc, setProfileDesc] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [saving, setSaving] = useState(false);

    // ✅ Fetch Real Plans
    const { data: myPlans = [] } = useQuery({
        queryKey: ['plans'],
        queryFn: loadPlans
    });

    useEffect(() => {
        if (user) {
            setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || "");
            setProfileDesc(user.user_metadata?.bio || "");
            setPreviewImage(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // For now, we use FileReader for instant preview as we might not have Storage buckets set up
            // In a real app, you would upload to Supabase Storage here
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setProfileImage(file); // Keep file for potential future upload
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        try {
            // Update Supabase User Metadata
            // Note: In a real app, upload 'profileImage' to storage first, get URL, then save here.
            // verifying we are just using the preview data URL or existing URL for now to suffice "change picture" requirement without backend storage
            const avatarUrlToSave = previewImage || user.user_metadata?.avatar_url;

            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: profileName,
                    bio: profileDesc,
                    avatar_url: avatarUrlToSave
                }
            });

            if (error) throw error;

            // Update Local Store
            setUser(data.user);
            toast.success("프로필이 저장되었습니다.");
        } catch (error) {
            console.error(error);
            toast.error("저장 실패: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Placeholder data
    const mockSchedules = [
        { id: 1, title: '파리 여름 여행', date: '2025.07.10 - 07.15', days: '6일', participants: 4, cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop' },
        { id: 2, title: '도쿄 맛집 투어', date: '2025.09.20 - 09.24', days: '5일', participants: 2, cover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2094&auto=format&fit=crop' },
        { id: 3, title: '제주도 힐링 여행', date: '2025.10.02 - 10.05', days: '4일', participants: 3, cover: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=2071&auto=format&fit=crop' },
    ];

    const mockWishlist = [
        { id: 1, title: '교토 전통 료칸', category: '숙소', rating: 4.8, cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop' },
        { id: 2, title: '루브르 박물관 가이드 투어', category: '액티비티', rating: 4.9, cover: 'https://images.unsplash.com/photo-1499856871940-b625a4aa4e53?q=80&w=2070&auto=format&fit=crop' },
    ];

    const mockReviews = [
        { id: 1, title: '스위스 알프스에서의 놀라운 경험', date: '2024.12.20', rating: 5, content: '풍경이 정말 숨막히게 아름다웠고 날씨도 완벽했습니다...', thumb: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2070&auto=format&fit=crop' },
        { id: 2, title: '주말 부산 여행', date: '2024.11.15', rating: 4, content: '음식은 훌륭했지만 교통이 좀 막혔어요.', thumb: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?q=80&w=1800&auto=format&fit=crop' },
    ];

    const mockPersona = {
        title: "여유로운 힐링 마스터",
        icon: "🌿",
        tags: ["#자연친화", "#호캉스", "#맛집탐방", "#힐링여행"],
        desc: "당신은 도심을 떠나 자연 속에서 진정한 휴식을 찾는 여행가입니다. 빡빡한 일정보다는 여유로운 시간을 선호하며, 맛있는 음식과 편안한 잠자리를 중요하게 생각합니다.",
        answers: [
            { step: "Step 2. 이동의 취향", question: "목적지까지 가는 시간, 당신의 텐션은?", answer: "비행기 표만 봐도 설레는 해외파 ✈️", icon: "✈️" },
            { step: "Step 3. 일정의 밀도", question: "여행지에서의 아침 9시, 당신은 무엇을 하고 있나?", answer: "암막 커튼 치고 꿀잠 중 🛌", icon: "🛌" },
            { step: "Step 4. 의외의 취향", question: "카페를 고를 때 당신의 최우선 기준은?", answer: "무조건 뷰! 바다나 산이 보여야 함 🌊", icon: "🌊" },
            { step: "Step 5. 소비의 가치", question: "이번 여행에서 돈을 '펑펑' 쓰고 싶은 곳은?", answer: "잠자리가 제일 중요해! 숙소에 몰빵 🛌", icon: "🏨" }
        ]
    };

    const mockBadges = [
        { id: 1, title: "첫 여권의 설렘", desc: "첫 해외여행을 완료했습니다.", icon: "✈️", unlocked: true, date: "2023.05.10" },
        { id: 2, title: "유럽 정복자", desc: "유럽 3개국 이상을 여행했습니다.", icon: "🏰", unlocked: true, date: "2024.08.15" },
        { id: 3, title: "단골 여행러", desc: "총 10회 이상 여행을 완료했습니다.", icon: "🏅", unlocked: false, progress: "8/10" },
        { id: 4, title: "미식가", desc: "맛집 리뷰를 20개 이상 작성했습니다.", icon: "🍽️", unlocked: false, progress: "12/20" },
        { id: 5, title: "5대륙 탐험가", desc: "5개 대륙을 모두 방문했습니다.", icon: "🌍", unlocked: false, progress: "2/5" },
        { id: 6, title: "사진 작가", desc: "포토 스팟 50곳을 방문했습니다.", icon: "📸", unlocked: true, date: "2024.12.20" },
        { id: 7, title: "혼행의 고수", desc: "나홀로 여행을 3회 이상 다녀왔습니다.", icon: "🎒", unlocked: false, progress: "1/3" },
        { id: 8, title: "섬 여행가", desc: "제주도, 발리 등 섬 여행지 5곳을 정복했습니다.", icon: "🏝️", unlocked: false, progress: "3/5" },
        { id: 9, title: "새벽을 여는 사람", desc: "일출 명소 3곳을 방문했습니다.", icon: "🌅", unlocked: true, date: "2024.01.01" },
        { id: 10, title: "계획형 인간", desc: "여행 일정을 100% 상세하게 작성했습니다.", icon: "📝", unlocked: true, date: "2023.11.12" },
    ];

    const mockNotifications = [
        { id: 1, type: 'like', actor: 'traveler_kim', message: '님이 회원님의 "스위스 알프스" 후기를 좋아합니다.', time: '방금 전', read: false, icon: '❤️' },
        { id: 2, type: 'comment', actor: 'happy_day', message: '님이 댓글을 남겼습니다: "저도 여기 꼭 가보고 싶네요!"', time: '2시간 전', read: false, icon: '💬' },
        { id: 3, type: 'badge', actor: '시스템', message: '축하합니다! "사진 작가" 뱃지를 획득하셨습니다. 🏆', time: '1일 전', read: true, icon: '🎉' },
        { id: 4, type: 'system', actor: '관리자', message: '회원님의 여행 일정이 3일 남았습니다. 준비물은 챙기셨나요?', time: '3일 전', read: true, icon: '🔔' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'schedules':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">나의 여행 일정</h1>
                                <p className="page-subtitle">다가오는 여행과 지난 여행을 관리하세요.</p>
                            </div>
                            <button className="action-btn" onClick={() => nav('/plans')}>+ 새 일정 만들기</button>
                        </div>
                        <div className="content-grid">
                            {myPlans.length > 0 ? myPlans.map(item => (
                                <div key={item.id} className="feature-card" onClick={() => nav('/plans')} style={{ cursor: 'pointer' }}>
                                    <div className="card-img-wrapper">
                                        <img src={item.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"} alt={item.title} className="card-img" />
                                        <span className="card-badge">{item.mood ? '#' + item.mood.toUpperCase() : '#TRIP'}</span>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="card-title">{item.title}</h3>
                                        <div className="card-meta">
                                            <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                                            <span>👥 {item.people}명</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">
                                    <p>아직 저장된 일정이 없습니다.</p>
                                    <button className="primary-btn" onClick={() => nav('/')} style={{ marginTop: '1rem' }}>
                                        여행 계획하러 가기
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 'style':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">나의 여행 바이오리듬</h1>
                                <p className="page-subtitle">지금까지의 여행 데이터를 기반으로 분석한 당신의 스타일입니다.</p>
                            </div>
                        </div>

                        <TravelBiorhythm plans={myPlans} />
                    </>
                );
            case 'badges':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">나의 여행 뱃지</h1>
                                <p className="page-subtitle">여행의 추억을 모아 업적을 달성해보세요.</p>
                            </div>
                            <div className="badge-stats">
                                <span>🏆 획득한 뱃지: <strong>{mockBadges.filter(b => b.unlocked).length}</strong> / {mockBadges.length}</span>
                            </div>
                        </div>
                        <div className="badge-grid">
                            {mockBadges.map(badge => (
                                <div key={badge.id} className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                                    <div className="badge-icon-wrapper">
                                        <span className="badge-icon">{badge.icon}</span>
                                        {!badge.unlocked && <span className="lock-overlay">🔒</span>}
                                    </div>
                                    <div className="badge-info">
                                        <h3 className="badge-title">{badge.title}</h3>
                                        <p className="badge-desc">{badge.desc}</p>
                                        {badge.unlocked ? (
                                            <span className="badge-date">달성일: {badge.date}</span>
                                        ) : (
                                            <div className="badge-progress-container">
                                                <span className="badge-progress-text">진행도: {badge.progress}</span>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${(parseInt(badge.progress.split('/')[0]) / parseInt(badge.progress.split('/')[1])) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'notifications':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">알림 센터</h1>
                                <p className="page-subtitle">새로운 소식과 반응을 확인하세요.</p>
                            </div>
                            <button className="action-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>모두 읽음 처리</button>
                        </div>
                        <div className="notification-list">
                            {mockNotifications.map(noti => (
                                <div key={noti.id} className={`notification-item ${!noti.read ? 'unread' : ''}`}>
                                    <div className="notification-icon-box">
                                        {noti.icon}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-text">
                                            <strong>{noti.actor}</strong>{noti.message}
                                        </div>
                                        <span className="notification-time">{noti.time}</span>
                                    </div>
                                    {!noti.read && <div className="notification-dot"></div>}
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'wishlist':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">찜 목록</h1>
                                <p className="page-subtitle">저장한 장소와 경험들을 모아보세요.</p>
                            </div>
                        </div>
                        <div className="content-grid">
                            {mockWishlist.map(item => (
                                <div key={item.id} className="feature-card">
                                    <div className="card-img-wrapper">
                                        <img src={item.cover} alt={item.title} className="card-img" />
                                        <span className="card-badge">⭐ {item.rating}</span>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="card-title">{item.title}</h3>
                                        <div className="card-meta">
                                            <span>🏷️ {item.category}</span>
                                        </div>
                                        <div className="card-actions">
                                            <button className="icon-btn">❤️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'memories':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">추억 되살리기</h1>
                                <p className="page-subtitle">당신의 소중한 여행 순간들을 다시 만나보세요.</p>
                            </div>
                        </div>

                        {/* 1. On This Day / Year in Travel Hero */}
                        <div className="memories-hero">
                            <div className="memories-content">
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                                    ✨ 2024 Year in Travel
                                </span>
                                <h2 className="memories-title">2024년, 3개국 8도시의 여정</h2>
                                <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                                    총 이동 거리 12,345km • 지구 0.3바퀴 <br />
                                    가장 행복했던 순간: 스위스 인터라켄 패러글라이딩
                                </p>
                                <button className="memories-play-btn" onClick={() => alert('타임랩스 영상이 재생됩니다 (구현 예정)')}>
                                    <span>▶</span> 2024 하이라이트 재생
                                </button>
                            </div>
                        </div>

                        {/* 2. On This Day */}
                        <div className="settings-section" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)' }}>
                            <h3 className="settings-title">📅 1년 전 오늘</h3>
                            <div className="timeline-card" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                                <img
                                    src="https://images.unsplash.com/photo-1499856871940-b625a4aa4e53?q=80&w=2070&auto=format&fit=crop"
                                    alt="Memory"
                                    style={{ width: '120px', height: '120px', borderRadius: '1rem', objectFit: 'cover' }}
                                />
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>파리, 에펠탑 아래에서의 피크닉</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                        "날씨가 너무 좋아서 바게트랑 와인 사들고 공원에 앉아있었다. 이게 행복이지!"
                                    </p>
                                    <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>★ 5.0</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Timeline & PDF */}
                        <div className="timeline-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 className="settings-title" style={{ margin: 0, border: 'none' }}>내 여행 히스토리북</h3>
                                <button className="action-btn" onClick={() => alert('PDF 다운로드가 시작됩니다.')}>
                                    📄 PDF 내보내기
                                </button>
                            </div>

                            <div className="timeline-card">
                                <div className="timeline-date">2024.12</div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>겨울 홋카이도 설국 여행</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>삿포로 - 오타루 - 비에이</p>
                                </div>
                            </div>
                            <div className="timeline-card">
                                <div className="timeline-date">2024.08</div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>뜨거운 여름, 발리 한 달 살기</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>우붓 - 짱구 - 스미냑</p>
                                </div>
                            </div>
                            <div className="timeline-card">
                                <div className="timeline-date">2023.05</div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>런던 & 파리 유럽 감성 여행</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>런던 아이 - 루브르 박물관</p>
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'reviews':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">내가 쓴 후기</h1>
                                <p className="page-subtitle">커뮤니티에 공유한 나의 생생한 후기들입니다.</p>
                            </div>
                        </div>
                        <div className="reviews-list">
                            {mockReviews.map(item => (
                                <div key={item.id} className="review-item">
                                    <img src={item.thumb} alt={item.title} className="review-thumb" />
                                    <div className="review-content">
                                        <div className="review-header">
                                            <h3 className="card-title" style={{ margin: 0 }}>{item.title}</h3>
                                            <span className="review-rating">{'★'.repeat(item.rating)}</span>
                                        </div>
                                        <p className="card-meta">{item.date}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'settings':
                return (
                    <div className="settings-container">
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">프로필 설정</h1>
                                <p className="page-subtitle">나의 프로필 정보를 수정하세요.</p>
                            </div>
                        </div>

                        <div className="settings-section">
                            <h3 className="settings-title">기본 정보</h3>

                            <div className="profile-upload-area">
                                <img
                                    src={previewImage || "https://ui-avatars.com/api/?name=" + (user?.email || "User") + "&background=random"}
                                    alt="Preview"
                                    className="upload-preview"
                                />
                                <div>
                                    <div className="upload-btn-wrapper">
                                        <button className="upload-btn">사진 변경</button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="file-input"
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        권장 크기: 300x300px 이상
                                    </p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">이름 (닉네임)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">소개 (Bio)</label>
                                <textarea
                                    className="form-textarea"
                                    value={profileDesc}
                                    onChange={(e) => setProfileDesc(e.target.value)}
                                    placeholder="자신을 자유롭게 소개해주세요"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="action-btn" onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? '저장 중...' : '저장하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="empty-state">준비 중인 기능입니다...</div>;
        }
    };

    return (
        <div className="mypage-container">
            {/* Sidebar */}
            <aside className="mypage-sidebar">
                <div className="profile-section">
                    <div className="profile-img-wrapper">
                        <img
                            src={user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + (user?.email || "User") + "&background=random"}
                            alt="Profile"
                            className="profile-img"
                        />
                    </div>
                    <h2 className="profile-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "게스트"}</h2>
                    <p className="profile-email" style={{ marginBottom: '0.5rem' }}>{user?.email || "로그인이 필요합니다"}</p>
                    {user?.user_metadata?.bio && (
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '1rem' }}>
                            "{user.user_metadata.bio}"
                        </p>
                    )}


                </div>

                <nav className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>
                        <span className="nav-icon">📅</span> 나의 일정
                    </div>
                    <div className={`nav-item ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>
                        <span className="nav-icon">🧬</span> 여행 성향
                    </div>
                    <div className={`nav-item ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
                        <span className="nav-icon">🏆</span> 나의 뱃지
                    </div>
                    <div className={`nav-item ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
                        <span className="nav-icon">❤️</span> 찜 목록
                    </div>
                    <div className={`nav-item ${activeTab === 'memories' ? 'active' : ''}`} onClick={() => setActiveTab('memories')}>
                        <span className="nav-icon">🎞️</span> 추억 되살리기
                    </div>
                    <div className="nav-item" onClick={() => nav('/reviews')}>
                        <span className="nav-icon">✍️</span> 나의 후기
                    </div>
                    <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <span className="nav-icon">🔔</span> 알림
                        {mockNotifications.filter(n => !n.read).length > 0 && (
                            <span className="nav-badge">{mockNotifications.filter(n => !n.read).length}</span>
                        )}
                    </div>

                    <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <span className="nav-icon">⚙️</span> 설정
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="mypage-content">
                {renderContent()}
            </main>
        </div>
    );
}
