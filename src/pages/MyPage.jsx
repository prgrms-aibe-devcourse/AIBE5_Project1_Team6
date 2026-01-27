import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/mypage.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadPlans, removePlan } from '../services/plansStorage';
import { loadSchedules } from '../services/schedulesStorage';
import { getMemories, getNotifications, getUserBadges, initializeUserBadgesIfEmpty, markNotificationAsRead, createTripNotifications } from '../services/mypageService';
import { communityService } from '../services/communityService';
import TravelBiorhythm from '../components/TravelBiorhythm';
import TravelStyleAnalysis from '../components/TravelStyleAnalysis';
import { FaChevronRight, FaChevronLeft, FaMapMarkedAlt, FaPen, FaHeart, FaBell, FaCog, FaSignOutAlt, FaUserSlash, FaRobot, FaChartPie, FaCalendarAlt, FaUserFriends, FaStar, FaCheckDouble, FaTrash, FaPlane, FaCommentDots } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// ... (Keep Helpers)
const formatNoise = (val) => {
    if (!val && val !== 0) return '정보 없음';
    const num = Number(val);
    if (num <= 5) return num <= 1 ? '매우 조용함' : num <= 2 ? '조용함' : num <= 3 ? '보통' : num <= 4 ? '다소 시끄러움' : '시끄러움';
    return num < 40 ? '조용함 (ASMR급)' : num < 60 ? '적당한 대화' : '북적이는 소음';
};

const formatLight = (val) => {
    if (!val && val !== 0) return '정보 없음';
    const num = Number(val);
    if (num <= 5) return num <= 2 ? '은은한 무드' : num <= 3 ? '적당한 밝기' : '화사하고 밝음';
    return num < 300 ? '아늑한 분위기' : num < 1000 ? '일상적인 밝기' : '햇살 가득한 밝기';
};

export default function MyPage() {
    const { user, setUser, signOut } = useAuthStore();
    const nav = useNavigate();
    const [activeTab, setActiveTab] = useState('main'); // Default to Main Dashboard
    const queryClient = useQueryClient();

    // Modals State
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // AI Plans Tab State
    const [aiTab, setAiTab] = useState('upcoming');

    // Review Detail State
    const [selectedReview, setSelectedReview] = useState(null);

    // Data Queries
    const { data: myPlans = [] } = useQuery({ queryKey: ['plans'], queryFn: loadPlans });
    const { data: aiSchedules = [] } = useQuery({ queryKey: ['schedules'], queryFn: loadSchedules });

    // Fetch user's reviews from community
    const { data: userReviews = [] } = useQuery({
        queryKey: ['userReviews', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await communityService.getPosts('review', 'latest', { type: '', keyword: '' }, { mood: null, themes: [] }, user.id);
            if (error) {
                console.error('Failed to fetch user reviews:', error);
                return [];
            }
            // Filter to only show posts by current user
            return data.filter(post => post.user_id === user.id);
        },
        enabled: !!user?.id
    });

    // Fetch user's notifications from database
    const { data: dbNotifications = [], refetch: refetchNotifications } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const data = await getNotifications(user.id);
            return data;
        },
        enabled: !!user?.id,
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    // Date Classification Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allSchedules = [...aiSchedules, ...myPlans];

    const upcomingSchedules = allSchedules.filter(item => {
        const end = item.endDate ? new Date(item.endDate) : (item.startDate ? new Date(item.startDate) : null);
        if (!end) return false;
        end.setHours(23, 59, 59, 999);
        return end >= today;
    });

    const pastSchedules = allSchedules.filter(item => {
        const end = item.endDate ? new Date(item.endDate) : (item.startDate ? new Date(item.startDate) : null);
        if (!end) return false;
        end.setHours(23, 59, 59, 999);
        return end < today;
    });

    const aiUpcomingSchedules = aiSchedules.filter(item => {
        const end = item.endDate ? new Date(item.endDate) : (item.startDate ? new Date(item.startDate) : null);
        if (!end) return false;
        end.setHours(23, 59, 59, 999);
        return end >= today;
    });

    const aiPastSchedules = aiSchedules.filter(item => {
        const end = item.endDate ? new Date(item.endDate) : (item.startDate ? new Date(item.startDate) : null);
        if (!end) return false;
        end.setHours(23, 59, 59, 999);
        return end < today;
    });

    // Mutations (Delete Plan)
    const deleteMutation = useMutation({
        mutationFn: removePlan,
        onSuccess: () => { toast.success("일정이 삭제되었습니다."); queryClient.invalidateQueries(['plans']); },
        onError: (err) => toast.error("삭제 실패: " + err.message)
    });

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm("정말 이 일정을 삭제하시겠습니까?")) deleteMutation.mutate(id);
    };

    // New: Handle Plan Click to Navigate to Result Page
    const handlePlanClick = (plan) => {
        // Map category to route
        // Default to /walk if category is missing or 'walk'
        let route = '/walk';
        if (plan.category === 'flight' || plan.category === 'airplane') route = '/airplane';
        if (plan.category === 'traffic') route = '/traffic';

        // Navigate
        nav(route);
    };

    // Profile State
    const [profileName, setProfileName] = useState('');
    const [profileDesc, setProfileDesc] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            // Prioritize metadata name -> email
            const name = user.user_metadata?.full_name || user.email?.split('@')[0];
            setProfileName(name);
            setProfileDesc(user.user_metadata?.bio || "");
            setPreviewImage(user.user_metadata?.avatar_url || null);

            // Initialize badges for demo purposes if empty
            initializeUserBadgesIfEmpty(user.id);
        }
    }, [user]);

    // Create trip notifications for upcoming schedules (with duplicate prevention)
    const notificationCreatedRef = useRef(false);

    useEffect(() => {
        // Only run once when data is loaded
        if (user?.id && (myPlans.length > 0 || aiSchedules.length > 0) && !notificationCreatedRef.current) {
            notificationCreatedRef.current = true;
            const allSchedules = [...myPlans, ...aiSchedules];
            createTripNotifications(user.id, allSchedules).then(() => {
                // Refetch notifications after creating trip notifications
                refetchNotifications();
            });
        }
    }, [user?.id, myPlans.length, aiSchedules.length]);

    // Handlers
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            signOut();
            nav('/');
            toast.success('로그아웃 되었습니다.');
            setShowLogoutModal(false);
        }
    };



    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const avatarUrlToSave = previewImage || user.user_metadata?.avatar_url;
            const { data, error } = await supabase.auth.updateUser({
                data: { full_name: profileName, bio: profileDesc, avatar_url: avatarUrlToSave }
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

    // Mocks for Stats
    const upcomingCount = upcomingSchedules.length;
    const pastCount = pastSchedules.length;

    // Mocks for Data
    const mockBadges = [
        { id: 1, title: "첫 여권의 설렘", desc: "첫 해외여행을 완료했습니다.", icon: "✈️", unlocked: true },
        { id: 2, title: "유럽 정복자", desc: "유럽 3개국 이상을 여행했습니다.", icon: "🏰", unlocked: true },
        { id: 3, title: "단골 여행러", desc: "총 10회 이상 여행을 완료했습니다.", icon: "🏅", unlocked: false },
    ];
    const mockWishlist = [
        { id: 1, title: '교토 전통 료칸', category: '숙소', rating: 4.8, cover: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e' },
        { id: 2, title: '루브르 박물관 가이드 투어', category: '액티비티', rating: 4.9, cover: 'https://images.unsplash.com/photo-1499856871940-b625a4aa4e53' },
    ];

    // Calculate unread count from database notifications
    const unreadCount = dbNotifications.filter(n => !n.is_read).length;

    const handleDeleteNotification = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            toast.success("알림이 삭제되었습니다.");
            refetchNotifications();
        } else {
            toast.error("알림 삭제에 실패했습니다.");
        }
    };

    const handleClearAllNotifications = async () => {
        if (window.confirm("모든 알림을 삭제하시겠습니까?")) {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user?.id);

            if (!error) {
                toast.success("모든 알림이 삭제되었습니다.");
                refetchNotifications();
            } else {
                toast.error("알림 삭제에 실패했습니다.");
            }
        }
    };

    const handleMarkAsRead = async (id) => {
        await markNotificationAsRead(id);
        refetchNotifications();
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifications = dbNotifications.filter(n => !n.is_read);

        for (const notification of unreadNotifications) {
            await markNotificationAsRead(notification.id);
        }

        toast.success("모든 알림을 읽음 처리했습니다.");
        refetchNotifications();
    };

    // Helper function to format notification time
    const formatNotificationTime = (createdAt) => {
        if (!createdAt) return '';

        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return created.toLocaleDateString('ko-KR');
    };


    // --- RENDER HELPERS ---

    const renderMainDashboard = () => (
        <div className="mypage-dashboard">
            <h1 className="mypage-title">마이페이지</h1>

            {/* Profile Header */}
            <div className="profile-header-card">
                <div className="profile-avatar">
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="avatar" />
                    ) : (
                        <div className="avatar-placeholder">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
                    )}
                </div>
                <div className="profile-info">
                    <h2 className="user-name">{user?.user_metadata?.full_name || user?.email || '여행러'}</h2>
                    <p className="user-greeting">{user?.user_metadata?.bio || "안녕하세요! 여행을 기록해보세요 👋"}</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card blue" onClick={() => setActiveTab('upcoming')} style={{ cursor: 'pointer' }}>
                    <div className="stat-label">📅 다가오는 여행</div>
                    <div className="stat-value">{upcomingCount} <span className="unit">건</span></div>
                </div>
                <div className="stat-card pink" onClick={() => setActiveTab('past')} style={{ cursor: 'pointer' }}>
                    <div className="stat-label">✈️ 지난 여행</div>
                    <div className="stat-value">{pastCount} <span className="unit">건</span></div>
                </div>
            </div>

            {/* Menu Group 1 */}
            <div className="menu-group">
                <div className="menu-item" onClick={() => setActiveTab('plans')}>
                    <div className="menu-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}><FaHeart /></div>
                    <span className="menu-text">저장된 장소</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('ai_plans')}>
                    <div className="menu-icon-wrapper" style={{ background: '#eff6ff', color: '#3b82f6' }}><FaPlane /></div>
                    <span className="menu-text">나의 여행 일정</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('analysis')}>
                    <div className="menu-icon-wrapper" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><FaChartPie /></div>
                    <span className="menu-text">나의 여행 성향</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('reviews')}>
                    <div className="menu-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}><FaPen /></div>
                    <span className="menu-text">나의 후기</span>
                    <FaChevronRight className="menu-arrow" />
                </div>

            </div>

            {/* Menu Group 2 */}
            <div className="menu-group">
                <div className="menu-item" onClick={() => setActiveTab('notifications')}>
                    <div className="menu-icon-wrapper" style={{ background: '#fff7ed', color: '#f97316' }}><FaBell /></div>
                    <span className="menu-text">알림</span>
                    {unreadCount > 0 && <span className="menu-badge">{unreadCount}</span>}
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('settings')}>
                    <div className="menu-icon-wrapper" style={{ background: '#f1f5f9', color: '#64748b' }}><FaCog /></div>
                    <span className="menu-text">설정</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mypage-footer">
                <button className="footer-btn" onClick={() => setShowLogoutModal(true)}>
                    로그아웃
                </button>
            </div>
        </div>
    );

    const renderSubPage = () => {
        const renderContent = () => {
            switch (activeTab) {
                case 'plans': return (
                    <div className="content-grid">
                        {myPlans.length > 0 ? myPlans.map(item => (
                            <div key={item.id} className="feature-card" onClick={() => handlePlanClick(item)} style={{ cursor: 'pointer', position: 'relative' }}>
                                <div className="card-img-wrapper">
                                    <img src={item.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"} alt={item.title} className="card-img" />
                                    <span className="card-badge">{item.mood ? '#' + item.mood.toUpperCase() : '#TRIP'}</span>
                                    <button onClick={(e) => handleDelete(e, item.id)} className="card-delete-btn">✕</button>
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title">{item.title}</h3>
                                    <div className="card-meta">
                                        <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <span>👥 {item.people}명</span>
                                    </div>
                                    {item.wellness && (
                                        <div className="wellness-mini-info">
                                            <span>🔊 {formatNoise(item.wellness.noise)}</span>
                                            <span>|</span>
                                            <span>💡 {formatLight(item.wellness.light)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : <div className="empty-state">저장된 일정이 없습니다.</div>}
                    </div>
                );
                case 'ai_plans': return (
                    <div className="ai-plans-container">
                        <div className="ai-tabs">
                            <button
                                className={`ai-tab ${aiTab === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setAiTab('upcoming')}
                            >
                                📅 예정된 여행 ({aiUpcomingSchedules.length})
                            </button>
                            <button
                                className={`ai-tab ${aiTab === 'past' ? 'active' : ''}`}
                                onClick={() => setAiTab('past')}
                            >
                                ✈️ 지난 여행 ({aiPastSchedules.length})
                            </button>
                        </div>

                        <div className="ai-plans-content">
                            {aiTab === 'upcoming' && (
                                <div className="content-grid">
                                    {aiUpcomingSchedules.length > 0 ? aiUpcomingSchedules.map(item => (
                                        <div key={item.id} className="feature-card ai-card" onClick={() => handlePlanClick(item)}>
                                            <div className="card-img-wrapper">
                                                <img src={item.heroImage || "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80"} alt="Upcoming Trip" className="card-img" />
                                                <span className="card-badge d-day">D-{Math.ceil((new Date(item.startDate) - new Date()) / (1000 * 60 * 60 * 24))}</span>
                                            </div>
                                            <div className="card-body">
                                                <div className="card-header-row">
                                                    <h3 className="card-title">{item.title}</h3>
                                                    <span className="ai-tag">AI Plan</span>
                                                </div>
                                                <div className="card-meta">
                                                    <span className="meta-item">📅 {new Date(item.startDate).toLocaleDateString()} 출발</span>
                                                    <span className="meta-item">👥 {item.people}명</span>
                                                </div>
                                                <p className="card-desc">{item.description || "새로운 모험이 기다리고 있습니다!"}</p>
                                                <div className="card-action-row">
                                                    <button className="small-action-btn">상세보기</button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">🏖️</div>
                                            <p>예정된 여행 일정이 없습니다.</p>
                                            <button className="primary-btn small" onClick={() => nav('/planlab')}>+ 새 일정 만들기</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {aiTab === 'past' && (
                                <div className="content-grid">
                                    {aiPastSchedules.length > 0 ? aiPastSchedules.map(item => (
                                        <div key={item.id} className="feature-card ai-card past" onClick={() => handlePlanClick(item)}>
                                            <div className="card-img-wrapper">
                                                <img src={item.heroImage || "https://images.unsplash.com/photo-1522881451255-f59ad836fbc5?auto=format&fit=crop&w=800&q=80"} alt="Past Trip" className="card-img" />
                                                <span className="card-badge finished">종료됨</span>
                                            </div>
                                            <div className="card-body">
                                                <h3 className="card-title">{item.title}</h3>
                                                <div className="card-meta">
                                                    <span className="meta-item">📅 {new Date(item.endDate).toLocaleDateString()} 다녀옴</span>
                                                </div>
                                                <p className="card-desc">{item.description || "즐거운 추억을 남기셨나요?"}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">🎒</div>
                                            <p>지난 여행 기록이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
                case 'upcoming': return (
                    <div className="content-grid">
                        {upcomingSchedules.length > 0 ? upcomingSchedules.map(item => (
                            <div key={item.id} className="feature-card" style={{ cursor: 'pointer', position: 'relative' }}>
                                <div className="card-img-wrapper">
                                    <img src={item.heroImage || "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80"} alt="Upcoming Trip" className="card-img" />
                                    <span className="card-badge" style={{ background: '#3b82f6', color: 'white' }}>D-{Math.ceil((new Date(item.startDate) - new Date()) / (1000 * 60 * 60 * 24))}</span>
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title">{item.title}</h3>
                                    <div className="card-meta">
                                        <span>📅 {new Date(item.startDate).toLocaleDateString()} 출발</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>{item.description || item.subtitle || "설명 없음"}</p>
                                </div>
                            </div>
                        )) : <div className="empty-state">다가오는 여행 계획이 없습니다.</div>}
                    </div>
                );
                case 'past': return (
                    <div className="content-grid">
                        {pastSchedules.length > 0 ? pastSchedules.map(item => (
                            <div key={item.id} className="feature-card" style={{ cursor: 'pointer', position: 'relative' }}>
                                <div className="card-img-wrapper">
                                    <img src={item.heroImage || "https://images.unsplash.com/photo-1522881451255-f59ad836fbc5?auto=format&fit=crop&w=800&q=80"} alt="Past Trip" className="card-img" style={{ filter: 'grayscale(0.8)' }} />
                                    <span className="card-badge" style={{ background: '#6b7280', color: 'white' }}>종료됨</span>
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title" style={{ color: '#666' }}>{item.title}</h3>
                                    <div className="card-meta">
                                        <span>📅 {new Date(item.endDate).toLocaleDateString()} 종료</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '4px' }}>{item.description || item.subtitle || "설명 없음"}</p>
                                </div>
                            </div>
                        )) : <div className="empty-state">지난 여행 기록이 없습니다.</div>}
                    </div>
                );
                case 'analysis': return (
                    <TravelStyleAnalysis schedules={[...myPlans, ...aiSchedules]} />
                );
                case 'reviews': return (
                    <div className="reviews-container">
                        {selectedReview ? (
                            <div className="review-detail-view">
                                <button className="review-back-btn" onClick={() => setSelectedReview(null)}>
                                    <FaChevronLeft /> 목록으로 돌아가기
                                </button>
                                <div className="review-detail-content">
                                    <div className="review-detail-header">
                                        <h2 className="review-detail-title">{selectedReview.title}</h2>
                                        <div className="review-detail-meta">
                                            <span>📅 {new Date(selectedReview.created_at).toLocaleDateString('ko-KR')}</span>
                                            <span className="star-rating">{'★'.repeat(selectedReview.rating || 5)}</span>
                                        </div>
                                    </div>
                                    {selectedReview.media && selectedReview.media.length > 0 && (
                                        <div className="review-detail-img-wrapper">
                                            <img src={selectedReview.media[0]} alt={selectedReview.title} className="review-detail-img" />
                                        </div>
                                    )}
                                    <div className="review-tags">
                                        {selectedReview.destination && <span className="review-tag">#{selectedReview.destination}</span>}
                                        {selectedReview.mood && <span className="review-tag">#{selectedReview.mood}</span>}
                                        {selectedReview.theme && <span className="review-tag">#{selectedReview.theme}</span>}
                                    </div>
                                    <p className="review-body-text">{selectedReview.body || selectedReview.content}</p>
                                    <div className="review-interactions">
                                        <div className="interaction-item red">
                                            <FaHeart /> {selectedReview.likes || 0}
                                        </div>
                                        <div className="interaction-item blue">
                                            <FaUserFriends /> {selectedReview.comments || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="reviews-list">
                                {userReviews.map(item => (
                                    <div key={item.id} className="review-card" onClick={() => setSelectedReview(item)}>
                                        <div className="review-card-thumb">
                                            <img
                                                src={item.media && item.media.length > 0 ? item.media[0] : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                                                alt={item.title}
                                            />
                                        </div>
                                        <div className="review-card-content">
                                            <div className="review-card-header">
                                                <h3 className="review-card-title">{item.title}</h3>
                                                <span className="review-card-rating">⭐ {item.rating || 5}</span>
                                            </div>
                                            <p className="review-card-snippet">{item.body?.substring(0, 100) || item.content?.substring(0, 100)}...</p>
                                            <div className="review-card-footer">
                                                <span className="review-date">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                                                <div className="review-card-stats">
                                                    <span>❤️ {item.likes || 0}</span>
                                                    <span>💬 {item.comments || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {userReviews.length === 0 && <div className="empty-state">작성한 후기가 없습니다.</div>}
                            </div>
                        )}
                    </div>
                );
                case 'wishlist': return (
                    <div className="content-grid">
                        {mockWishlist.map(item => (
                            <div key={item.id} className="feature-card">
                                <div className="card-img-wrapper">
                                    <img src={item.cover} alt={item.title} className="card-img" />
                                    <span className="card-badge">⭐ {item.rating}</span>
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title">{item.title}</h3>
                                    <span className="card-meta">🏷️ {item.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
                case 'notifications': return (

                    <div className="notification-list-container">
                        <div className="notification-header-actions">
                            <span className="noti-count-label">총 {dbNotifications.length}개</span>
                            <div className="noti-actions">
                                <button className="action-pill-btn" onClick={handleMarkAllAsRead}>
                                    <FaCheckDouble /> 모두 읽음
                                </button>
                                <button className="action-pill-btn danger" onClick={handleClearAllNotifications}>
                                    <FaTrash /> 전체 삭제
                                </button>
                            </div>
                        </div>

                        {dbNotifications.map(noti => {
                            let Icon = FaBell;
                            let colorClass = 'gray';
                            if (noti.type === 'like') { Icon = FaHeart; colorClass = 'red'; }
                            if (noti.type === 'schedule') { Icon = FaCalendarAlt; colorClass = 'blue'; }
                            if (noti.type === 'comment') { Icon = FaCommentDots; colorClass = 'green'; }

                            return (
                                <div key={noti.id} className={`notification-card ${!noti.is_read ? 'unread' : ''}`} onClick={() => handleMarkAsRead(noti.id)}>
                                    <div className={`noti-icon-box ${colorClass}`}>
                                        <Icon />
                                    </div>
                                    <div className="noti-content-wrapper">
                                        <p className="noti-message">{noti.message}</p>
                                        <span className="noti-time">{formatNotificationTime(noti.created_at)}</span>
                                    </div>
                                    <div className="noti-right-actions">
                                        {!noti.is_read && <div className="noti-unread-dot"></div>}
                                        <button
                                            className="noti-delete-btn"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNotification(noti.id); }}
                                            title="알림 삭제"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {dbNotifications.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">🔕</div>
                                새로운 알림이 없습니다.
                            </div>
                        )}
                    </div>
                );
                case 'settings': return (
                    <div className="settings-section">
                        <div className="profile-upload-area">
                            <img src={previewImage || user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + (user?.email || "User")} alt="Preview" className="upload-preview" />
                            <div className="upload-btn-wrapper">
                                <label className="upload-btn" style={{ cursor: 'pointer' }}>
                                    사진 변경
                                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">이름</label>
                            <input type="text" className="form-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">소개</label>
                            <textarea className="form-textarea" value={profileDesc} onChange={(e) => setProfileDesc(e.target.value)} />
                        </div>
                        <button className="primary-btn" onClick={handleSaveProfile} disabled={saving}>{saving ? '저장 중...' : '저장하기'}</button>
                    </div>
                );
                default: return null;
            }
        };

        const titles = {
            plans: '저장된 장소',
            ai_plans: '나의 여행 일정',
            upcoming: '다가오는 여행',
            past: '지난 여행',
            analysis: '내 여행 성향',
            reviews: '나의 후기',
            notifications: '알림',
            settings: '설정'
        };

        return (
            <div className="mypage-subpage">
                <div className="subpage-header">
                    <button className="back-btn" onClick={() => setActiveTab('main')}>
                        <FaChevronLeft />
                    </button>
                    <h2 className="subpage-title">{titles[activeTab]}</h2>
                    <div style={{ width: 24 }}></div> {/* Spacer */}
                </div>
                <div className="subpage-content">
                    {renderContent()}
                </div>
            </div>
        );
    };

    return (
        <div className="mypage-wrapper">
            {activeTab === 'main' ? renderMainDashboard() : renderSubPage()}

            {/* Logout Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowLogoutModal(false)}
                    >
                        <motion.div
                            className="modal-content small"
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="modal-title">로그아웃</h3>
                            <p className="modal-text">정말 로그아웃 하시겠습니까?</p>
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={() => setShowLogoutModal(false)}>취소</button>
                                <button className="modal-btn confirm" onClick={handleLogout}>확인</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}
