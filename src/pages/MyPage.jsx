import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/mypage.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadPlans, removePlan } from '../services/plansStorage';
import { getMemories, getNotifications, getUserBadges, initializeUserBadgesIfEmpty, markNotificationAsRead } from '../services/mypageService';
import TravelBiorhythm from '../components/TravelBiorhythm';

// ✅ Helpers for Human-Readable Wellness
const formatNoise = (val) => {
    if (!val && val !== 0) return '정보 없음';
    const num = Number(val);
    // If level (1-5)
    if (num <= 5) {
        if (num <= 1) return '매우 조용함';
        if (num <= 2) return '조용함';
        if (num <= 3) return '보통';
        if (num <= 4) return '다소 시끄러움';
        return '시끄러움';
    }
    // If dB (30-100)
    if (num < 40) return '조용함 (ASMR급)';
    if (num < 60) return '적당한 대화';
    return '북적이는 소음';
};

const formatLight = (val) => {
    if (!val && val !== 0) return '정보 없음';
    const num = Number(val);
    // If level (1-5)
    if (num <= 5) {
        if (num <= 2) return '은은한 무드';
        if (num <= 3) return '적당한 밝기';
        return '화사하고 밝음';
    }
    // If lux (100-2000)
    if (num < 300) return '아늑한 분위기';
    if (num < 1000) return '일상적인 밝기';
    return '햇살 가득한 밝기';
};

export default function MyPage() {
    const { user, setUser } = useAuthStore();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState('schedules');
    const queryClient = useQueryClient();

    // ✅ Delete Plan Mutation
    const deleteMutation = useMutation({
        mutationFn: removePlan,
        onSuccess: () => {
            toast.success("일정이 삭제되었습니다.");
            queryClient.invalidateQueries(['plans']);
        },
        onError: (err) => {
            toast.error("삭제 실패: " + err.message);
        }
    });

    const handleDelete = (e, id) => {
        e.stopPropagation(); // prevent card click
        if (window.confirm("정말 이 일정을 삭제하시겠습니까?")) {
            deleteMutation.mutate(id);
        }
    };

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

    // ✅ Fetch Memories
    const { data: memories = [] } = useQuery({
        queryKey: ['memories', user?.id],
        queryFn: getMemories,
        enabled: !!user
    });

    // ✅ Fetch Notifications
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: getNotifications,
        enabled: !!user
    });

    // ✅ Fetch Badges
    const { data: badges = [] } = useQuery({
        queryKey: ['badges', user?.id],
        queryFn: () => getUserBadges(user?.id),
        enabled: !!user
    });

    useEffect(() => {
        if (user) {
            setProfileName(user.user_metadata?.full_name || user.email?.split('@')[0] || "");
            setProfileDesc(user.user_metadata?.bio || "");
            setPreviewImage(user.user_metadata?.avatar_url || null);

            // Initialize badges for demo purposes if empty
            initializeUserBadgesIfEmpty(user.id);
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
            const avatarUrlToSave = previewImage || user.user_metadata?.avatar_url;
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: profileName,
                    bio: profileDesc,
                    avatar_url: avatarUrlToSave
                }
            });
            if (error) throw error;
            setUser(data.user);
            toast.success("프로필이 저장되었습니다.");
        } catch (error) {
            console.error(error);
            toast.error("저장 실패: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            // Invalidate query to refresh UI if needed, or optimistically update
        } catch (e) {
            console.error(e);
        }
    };

    const mockWishlist = [
        { id: 1, title: '교토 전통 료칸', category: '숙소', rating: 4.8, cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop' },
        { id: 2, title: '루브르 박물관 가이드 투어', category: '액티비티', rating: 4.9, cover: 'https://images.unsplash.com/photo-1499856871940-b625a4aa4e53?q=80&w=2070&auto=format&fit=crop' },
    ];

    const mockReviews = [
        { id: 1, title: '스위스 알프스에서의 놀라운 경험', date: '2024.12.20', rating: 5, content: '풍경이 정말 숨막히게 아름다웠고 날씨도 완벽했습니다...', thumb: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2070&auto=format&fit=crop' },
        { id: 2, title: '주말 부산 여행', date: '2024.11.15', rating: 4, content: '음식은 훌륭했지만 교통이 좀 막혔어요.', thumb: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?q=80&w=1800&auto=format&fit=crop' },
    ];

    // Gamification Logic with Real Data
    const totalXp = badges.filter(b => b.earned).reduce((acc, curr) => acc + curr.xp, 0);
    const currentLevel = Math.max(1, Math.floor(totalXp / 100) + 1);
    const nextLevelXp = currentLevel * 100;
    const progressToNextLevel = totalXp % 100;

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
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDelete(e, item.id)}
                                            style={{
                                                position: 'absolute', top: '10px', right: '10px',
                                                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                                width: '28px', height: '28px', color: '#fff', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="card-body">
                                        <h3 className="card-title">{item.title}</h3>
                                        <div className="card-meta">
                                            <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                                            <span>👥 {item.people}명</span>
                                            {item.totalCost > 0 && <span>💰 {Math.round(item.totalCost / 10000)}만원</span>}
                                        </div>
                                        {/* Wellness Info */}
                                        {item.wellness && (
                                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#666', display: 'flex', gap: '8px', background: '#f8f9fa', padding: '6px 10px', borderRadius: '6px' }}>
                                                <span>🔊 {formatNoise(item.wellness.noise)}</span>
                                                <span style={{ color: '#ddd' }}>|</span>
                                                <span>💡 {formatLight(item.wellness.light)}</span>
                                                <span style={{ color: '#ddd' }}>|</span>
                                                <span>👥 {item.wellness.crowd}</span>
                                            </div>
                                        )}
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

                        {/* 1. System/Hero Area (For now static, can be dynamic later) */}
                        <div className="memories-hero">
                            <div className="memories-content">
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'inline-block' }}>
                                    ✨ My Travel History
                                </span>
                                <h2 className="memories-title">나의 여행, 그 특별한 순간들</h2>
                                <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
                                    기록된 여행 추억: {memories.length}개
                                </p>
                            </div>
                        </div>

                        {/* Real Memories Data */}
                        <div className="timeline-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 className="settings-title" style={{ margin: 0, border: 'none' }}>기록된 추억들</h3>
                            </div>

                            {memories.length > 0 ? memories.map(mem => (
                                <div key={mem.id} className="timeline-card">
                                    {mem.image_url && (
                                        <img
                                            src={mem.image_url}
                                            alt={mem.title}
                                            style={{ width: '120px', height: '120px', borderRadius: '1rem', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{mem.title}</h4>
                                            <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px', color: '#3b82f6' }}>
                                                {mem.travel_date ? new Date(mem.travel_date).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            {mem.description}
                                        </p>
                                        <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{'★'.repeat(mem.rating)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">
                                    <p>아직 기록된 추억이 없습니다.</p>
                                </div>
                            )}
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
            case 'notifications':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">알림</h1>
                                <p className="page-subtitle">내 활동에 대한 새 소식을 확인하세요.</p>
                            </div>
                        </div>
                        <div className="notifications-list">
                            {notifications.length > 0 ? (
                                notifications.map(item => (
                                    <div key={item.id}
                                        onClick={() => handleNotificationRead(item.id)}
                                        className={`notification-item ${!item.is_read ? 'unread' : ''}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '1rem',
                                            marginBottom: '0.8rem',
                                            borderLeft: item.is_read ? '3px solid transparent' : '3px solid #3b82f6',
                                            cursor: 'pointer'
                                        }}>
                                        <div className="notification-icon" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: item.type === 'like' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                            color: item.type === 'like' ? '#ef4444' : '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '1rem',
                                            fontSize: '1.2rem'
                                        }}>
                                            {item.type === 'like' ? '❤️' : '💬'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{item.related_user_name}</span>
                                                {item.message}
                                            </p>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        {!item.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <p>새로운 알림이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 'badges':
                return (
                    <>
                        <div className="content-header">
                            <div>
                                <h1 className="page-title">나의 여행 뱃지</h1>
                                <p className="page-subtitle">여행의 즐거움을 더해주는 특별한 업적들입니다.</p>
                            </div>
                            <div className="badge-summary">
                                <span>총 획득 XP: <strong>{totalXp}</strong></span>
                            </div>
                        </div>

                        <div className="badge-grid">
                            {badges.map(badge => (
                                <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                                    <div className="badge-icon-wrapper">
                                        <span className="badge-icon">{badge.icon}</span>
                                        {badge.earned && <span className="badge-check">✓</span>}
                                    </div>
                                    <h3 className="badge-title">{badge.title}</h3>
                                    <p className="badge-desc">{badge.desc}</p>
                                    {!badge.earned && badge.progress && (
                                        <div className="badge-progress-container">
                                            <div className="badge-progress-text">진행도 {badge.progress}</div>
                                            <div className="badge-progress-bar">
                                                <div
                                                    className="badge-progress-fill"
                                                    style={{ width: `${(badge.rawProgress / badge.rawGoal) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    {badge.earned && <p className="badge-date">획득일: {badge.date}</p>}
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
                    <div className="profile-level-container">
                        <div className="level-badge">Lv.{currentLevel} 여행 탐험가</div>
                        <div className="level-progress-bar">
                            <div className="level-progress-fill" style={{ width: `${progressToNextLevel}%` }}></div>
                        </div>
                        <p className="level-text">{totalXp} XP / {nextLevelXp} XP</p>
                    </div>


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
                    </div>
                    <div className={`nav-item ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
                        <span className="nav-icon">🏆</span> 뱃지/업적
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
