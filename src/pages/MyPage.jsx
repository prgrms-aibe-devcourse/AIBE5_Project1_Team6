import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/mypage.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadPlans, removePlan } from '../services/plansStorage';
import { loadSchedules } from '../services/schedulesStorage';
import { getMemories, getNotifications, getUserBadges, initializeUserBadgesIfEmpty, markNotificationAsRead } from '../services/mypageService';
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

    // Initial Mock Data
    const initialNotifications = [
        { id: 1, type: 'like', message: '김철수님이 회원님의 "스위스 여행" 후기를 좋아합니다.', time: '방금 전', read: false },
        { id: 2, type: 'comment', message: '이영희님이 "오사카 먹방 투어" 후기에 댓글을 남겼습니다: "저도 여기 가봤는데 정말 맛있더라고요!"', time: '10분 전', read: false },
        { id: 3, type: 'schedule', message: '오사카 3박 4일 여행이 3일 남았습니다. 준비물 챙기셨나요?', time: '30분 전', read: false },
    ];
    const [notifications, setNotifications] = useState(initialNotifications);

    // Data Queries
    const { data: myPlans = [] } = useQuery({ queryKey: ['plans'], queryFn: loadPlans });
    const { data: aiSchedules = [] } = useQuery({ queryKey: ['schedules'], queryFn: loadSchedules });

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
    const mockReviews = [
        {
            id: 1,
            title: '스위스 알프스에서의 놀라운 경험 🏔️',
            date: '2024.12.20',
            rating: 5,
            content: '융프라우요흐의 만년설은 정말 장관이었습니다. 기차 여행도 너무 낭만적이었고...',
            fullContent: "스위스 여행은 제 인생 최고의 선택이었어요! \n\n유럽의 지붕이라 불리는 융프라우요흐에 올라갔을 때의 그 감동은 말로 표현할 수 없습니다. \n\n기차를 타고 올라가는 내내 창밖으로 보이는 풍경이 한 폭의 그림 같았고, 정상에서 먹은 신라면은 정말 꿀맛이었죠. \n\n숙소는 인터라켄에 잡았는데, 아침에 눈을 떴을 때 창문 너머로 보이는 설산의 풍경이...",
            thumb: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99',
            tags: ['스위스', '알프스', '자연', '힐링'],
            likes: 124,
            comments: 45
        },
        {
            id: 2,
            title: '오사카 먹방 투어, 여기가 찐이다! 🍜',
            date: '2023.10.15',
            rating: 4,
            content: '도톤보리의 타코야키, 오코노미야키... 하루에 5끼를 먹어도 부족했던 오사카 식도락 여행 후기.',
            fullContent: "오사카는 정말 먹다 죽는다는 말이 딱 맞아요. \n\n도톤보리 강가를 거닐며 먹은 타코야키, 그리고 줄 서서 먹은 이치란 라멘... \n\n특히 구로몬 시장에서 먹은 신선한 해산물들은 잊을 수가 없네요. \n\n유니버셜 스튜디오도 갔는데 닌텐도 월드는 사람이 너무 많아서...",
            thumb: 'https://images.unsplash.com/photo-1590559899731-a068f637db64',
            tags: ['일본', '오사카', '먹방', '맛집'],
            likes: 89,
            comments: 12
        },
        {
            id: 3,
            title: '발리 우붓에서의 완벽한 휴식 🌿',
            date: '2024.01.10',
            rating: 5,
            content: '초록빛 논뷰를 바라보며 즐기는 요가, 그리고 풀빌라에서의 수영. 지상낙원이 따로 없네요.',
            fullContent: "발리 우붓은 정말 힐링 그 자체였습니다. \n\n아침 일찍 요가 클래스를 듣고, 신선한 과일로 만든 스무디 볼을 먹으니 몸과 마음이 정화되는 기분이었어요. \n\n몽키 포레스트에서 원숭이들과 재미있는 추억도 만들었고, 특히 저녁에 풀빌라에서 본 쏟아지는 별들은 평생 잊지 못할 것 같습니다. \n\n디지털 디톡스를 원하신다면 우붓을 강력 추천합니다!",
            thumb: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
            tags: ['발리', '휴양', '요가', '풀빌라'],
            likes: 215,
            comments: 34
        },
        {
            id: 4,
            title: '낭만의 도시 파리, 에펠탑 야경 ✨',
            date: '2023.11.05',
            rating: 4,
            content: '센강 유람선을 타고 바라본 에펠탑의 반짝임. 파리는 역시 사랑의 도시였습니다.',
            fullContent: "파리에 도착하자마자 느껴지는 그 특유의 낭만적인 분위기! \n\n낮에는 루브르 박물관과 오르세 미술관을 돌며 예술에 취하고, 밤에는 바토무슈를 타고 에펠탑의 정각 반짝임(화이트 에펠)을 감상했습니다. \n\n길거리 빵집에서 사 먹은 크루아상은 한국에서 먹던 것과는 차원이 다르더군요. \n\n다만 소매치기는 조심해야 해요! 가방 꼭 붙들고 다니세요.",
            thumb: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
            tags: ['프랑스', '파리', '야경', '예술'],
            likes: 178,
            comments: 28
        }
    ];
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleDeleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success("알림이 삭제되었습니다.");
    };

    const handleClearAllNotifications = () => {
        if (window.confirm("모든 알림을 삭제하시겠습니까?")) {
            setNotifications([]);
            toast.success("모든 알림이 삭제되었습니다.");
        }
    };

    const handleMarkAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("모든 알림을 읽음 처리했습니다.");
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
                                            <span>📅 {selectedReview.date}</span>
                                            <span className="star-rating">{'★'.repeat(selectedReview.rating)}</span>
                                        </div>
                                    </div>
                                    <div className="review-detail-img-wrapper">
                                        <img src={selectedReview.thumb} alt={selectedReview.title} className="review-detail-img" />
                                    </div>
                                    <div className="review-tags">
                                        {selectedReview.tags.map((tag, idx) => (
                                            <span key={idx} className="review-tag">#{tag}</span>
                                        ))}
                                    </div>
                                    <p className="review-body-text">{selectedReview.fullContent}</p>
                                    <div className="review-interactions">
                                        <div className="interaction-item red">
                                            <FaHeart /> {selectedReview.likes}
                                        </div>
                                        <div className="interaction-item blue">
                                            <FaUserFriends /> {selectedReview.comments}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="reviews-list">
                                {mockReviews.map(item => (
                                    <div key={item.id} className="review-card" onClick={() => setSelectedReview(item)}>
                                        <div className="review-card-thumb">
                                            <img src={item.thumb} alt={item.title} />
                                        </div>
                                        <div className="review-card-content">
                                            <div className="review-card-header">
                                                <h3 className="review-card-title">{item.title}</h3>
                                                <span className="review-card-rating">⭐ {item.rating}</span>
                                            </div>
                                            <p className="review-card-snippet">{item.content}</p>
                                            <div className="review-card-footer">
                                                <span className="review-date">{item.date}</span>
                                                <div className="review-card-stats">
                                                    <span>❤️ {item.likes}</span>
                                                    <span>💬 {item.comments}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {mockReviews.length === 0 && <div className="empty-state">작성한 후기가 없습니다.</div>}
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
                            <span className="noti-count-label">총 {notifications.length}개</span>
                            <div className="noti-actions">
                                <button className="action-pill-btn" onClick={handleMarkAllAsRead}>
                                    <FaCheckDouble /> 모두 읽음
                                </button>
                                <button className="action-pill-btn danger" onClick={handleClearAllNotifications}>
                                    <FaTrash /> 전체 삭제
                                </button>
                            </div>
                        </div>

                        {notifications.map(noti => {
                            let Icon = FaBell;
                            let colorClass = 'gray';
                            if (noti.type === 'like') { Icon = FaHeart; colorClass = 'red'; }
                            if (noti.type === 'schedule') { Icon = FaCalendarAlt; colorClass = 'blue'; }
                            if (noti.type === 'comment') { Icon = FaCommentDots; colorClass = 'green'; }

                            return (
                                <div key={noti.id} className={`notification-card ${!noti.read ? 'unread' : ''}`} onClick={() => handleMarkAsRead(noti.id)}>
                                    <div className={`noti-icon-box ${colorClass}`}>
                                        <Icon />
                                    </div>
                                    <div className="noti-content-wrapper">
                                        <p className="noti-message">{noti.message}</p>
                                        <span className="noti-time">{noti.time}</span>
                                    </div>
                                    <div className="noti-right-actions">
                                        {!noti.read && <div className="noti-unread-dot"></div>}
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
                        {notifications.length === 0 && (
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
            plans: '내 여행 플랜',
            ai_plans: 'AI 여행 계획',
            upcoming: '다가오는 여행',
            past: '지난 여행',
            analysis: '내 여행 성향',
            reviews: '내가 쓴 글',
            wishlist: '저장한 장소',
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
