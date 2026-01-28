import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import '../styles/mypage.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadPlans, removePlan } from '../services/plansStorage';
import { loadSchedules } from '../services/schedulesStorage';
import { getSavedPlaces, deletePlace } from '../services/savedPlacesService';
import { getMemories, getNotifications, getUserBadges, initializeUserBadgesIfEmpty, markNotificationAsRead, getProfile, markAllNotificationsAsRead, deleteAllNotifications, deleteNotification } from '../services/mypageService';
import { communityService } from '../services/communityService';
import ReviewDetailModal from '../components/community/ReviewDetailModal';
import TravelBiorhythm from '../components/TravelBiorhythm';
import TravelStyleAnalysis from '../components/TravelStyleAnalysis';
import RecommendationCard from '../components/RecommendationCard';
import TripDetailDrawer from '../components/TripDetailDrawer';
import ScheduleDetailView from '../components/ScheduleDetailView';
import { improvePlanText } from '../services/aiPlanner';
import { simpleDiff } from '../services/diff';
import { addPlan } from '../services/plansStorage';
import { addSchedule } from '../services/schedulesStorage';
import { FaChevronRight, FaChevronLeft, FaMapMarkedAlt, FaPen, FaHeart, FaRegHeart, FaBell, FaCog, FaSignOutAlt, FaUserSlash, FaRobot, FaChartPie, FaCalendarAlt, FaUserFriends, FaStar, FaCheckDouble, FaTrash, FaPlane, FaCommentDots, FaComment } from 'react-icons/fa';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'main'; // Default to Main Dashboard
    const queryClient = useQueryClient();

    // Helper to change tab
    // push: true adds to history (default behavior of setSearchParams), allowing back button
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    // Modals State
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // AI Plans Tab State
    const [aiTab, setAiTab] = useState('upcoming');

    // Review Detail State
    const [selectedReview, setSelectedReview] = useState(null);

    // 상세 보기 (Drawer) 관련 상태
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [drawerNights, setDrawerNights] = useState(1);
    const [drawerPeople, setDrawerPeople] = useState(2);
    const [drawerPlanText, setDrawerPlanText] = useState("");
    const [drawerDiffResult, setDrawerDiffResult] = useState(null);
    const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState(null);

    // --- Queries ---
    const { data: profile } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: () => getProfile(user?.id),
        enabled: !!user
    });

    // Notifications Query
    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => getNotifications(user?.id),
        enabled: !!user,
        select: (data) => data.map(n => ({
            id: n.id,
            type: n.type,
            text: n.message,
            time: new Date(n.created_at).toLocaleString(),
            isRead: n.is_read,
            link: n.link
        }))
    });

    const { data: myPlans = [] } = useQuery({ queryKey: ['plans'], queryFn: loadPlans });

    // Saved Places Query (from Walk/Traffic/Airplane pages)
    const { data: savedPlaces = [] } = useQuery({
        queryKey: ['savedPlaces', user?.id],
        queryFn: () => getSavedPlaces(user?.id),
        enabled: !!user?.id,
    });

    const handleDeleteSavedPlace = async (placeId) => {
        try {
            await deletePlace(placeId);
            queryClient.invalidateQueries(['savedPlaces']);
            toast.success("저장된 장소가 삭제되었습니다.");
        } catch (error) {
            toast.error("삭제에 실패했습니다.");
        }
    };

    const { data: memories = [] } = useQuery({
        queryKey: ['memories', user?.id],
        queryFn: getMemories,
        enabled: !!user
    });
    const { data: aiSchedules = [] } = useQuery({ queryKey: ['schedules'], queryFn: loadSchedules });
    
    // Fetch User Reviews
    const { data: myReviews = [] } = useQuery({
        queryKey: ['myReviews', user?.id],
        queryFn: async () => {
             if (!user) return [];
             const { data } = await communityService.getPosts(
                 'review', 
                 'latest', 
                 { type: '', keyword: '' }, 
                 { mood: null, themes: [] }, 
                 user.id, 
                 user.id // filterUserId
             );
             
             // Map to MyPage format
             return data.map(post => {
                 // Force author info to current user since this IS "My Page"
                 const authorName = post.profiles?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || '익명';
                 const authorAvatar = post.profiles?.avatar_url || user.user_metadata?.avatar_url || '';

                 return {
                    id: post.id,
                    title: post.title,
                    date: new Date(post.created_at).toLocaleDateString(),
                    rating: post.rating || 0,
                    content: post.body?.substring(0, 100) + (post.body?.length > 100 ? '...' : '') || '',
                    fullContent: post.body,
                    thumb: post.media && post.media.length > 0 
                        ? (typeof post.media[0] === 'string' ? post.media[0] : post.media[0].url)
                        : 'https://via.placeholder.com/150',
                    tags: [post.mood, ...(post.themes || [])].filter(Boolean),
                    likes: post.likes || 0,
                    comments: post.comments || post.comment_count || 0, // Ensure we get the count
                    
                    // Fields for ReviewDetailModal
                    is_liked: post.is_liked,
                    author_name: authorName,
                    author_avatar: authorAvatar,
                    destination: post.destination,
                    created_at: post.created_at,
                    mood: post.mood,
                    themes: post.themes,
                    media: post.media,
                    body: post.body,
                    user_id: user.id,

                    originalPost: {
                        ...post,
                        author_name: authorName,
                        author_avatar: authorAvatar,
                        user_id: user.id
                    } 
                 };
             });
        },
        enabled: !!user
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
        onSuccess: () => {
            queryClient.invalidateQueries(['plans']);
            toast.success("플랜이 삭제되었습니다.");
        }
    });

    const addScheduleMutation = useMutation({
        mutationFn: addSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
        }
    });

    // 상세 보기 (Drawer) 핸들러
    const handlePlaceClick = (place) => {
        const rawData = place.place_data || {};
        const mergedItem = {
            ...rawData,
            title: place.title,
            firstimage: place.image,
            addr1: place.description,
            category: place.category,
            savedPlaceId: place.id // 삭제를 위해 원본 ID 저장
        };
        
        setSelectedPlace(mergedItem);
        setDrawerNights(1);
        setDrawerPeople(2);
        setDrawerPlanText(mergedItem.planText || "");
        setDrawerDiffResult(null);
    };

    const handleImprovePlace = (detail) => {
        if (!selectedPlace) return;
        const improved = improvePlanText({
            title: selectedPlace.title,
            nights: drawerNights,
            people: drawerPeople,
            planText: drawerPlanText,
            stays: selectedPlace.stays ?? [],
            foods: selectedPlace.foods ?? [],
            theme: 'healing',
            category: selectedPlace.category || 'walk',
            detail
        });
        setDrawerDiffResult(simpleDiff(drawerPlanText, improved));
        setDrawerPlanText(improved);
    };

    const onSaveFromDrawer = async (payload) => {
        try {
            // 저장된 장소를 실제 일정(Schedule)으로 변환하여 추가
            const scheduleData = {
                title: payload.title,
                description: payload.subtitle || "저장된 장소로부터 생성된 일정",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                people: payload.people || 2,
                scheduleText: payload.planText || "",
                items: payload.items || [],
                totalCost: payload.totalCost || 0,
                moodData: {
                    mood: 'refresh',
                    destination: payload.title,
                    style: 'relaxed'
                }
            };
            
            await addScheduleMutation.mutateAsync(scheduleData);

            // 핵심: '저장된 장소' -> '일정'으로 이동 (삭제 처리)
            if (selectedPlace?.savedPlaceId) {
                await deletePlace(selectedPlace.savedPlaceId);
                queryClient.invalidateQueries(['savedPlaces']);
            }

            toast.success(`"${payload.title}" 일정이 추가되었습니다! [나의 여행 계획]에서 확인하세요.`);
            setSelectedPlace(null);
            
            // 일정관리 탭으로 이동할지 여부는 사용자 선택이지만, 일단 마이페이지에 유지
        } catch (e) {
            toast.error("일정 추가 실패: " + e.message);
        }
    };
    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm("정말 이 일정을 삭제하시겠습니까?")) deleteMutation.mutate(id);
    };

    // Handle Plan Click to show Schedule Detail View
    const handlePlanClick = (plan) => {
        setSelectedScheduleForDetail(plan);
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

            // 1. Update Auth Metadata
            const { data, error } = await supabase.auth.updateUser({
                data: { full_name: profileName, bio: profileDesc, avatar_url: avatarUrlToSave }
            });
            if (error) throw error;

            // 2. Update Public Profiles Table (Sync)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: profileName,
                    introduction: profileDesc,
                    avatar_url: avatarUrlToSave,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) {
                console.error('Profile sync error:', profileError);
                throw new Error('프로필 동기화 실패: ' + profileError.message);
            }

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

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
            queryClient.invalidateQueries(['notifications']);
            toast.success('알림이 삭제되었습니다.');
        } catch (error) {
            console.error('삭제 실패:', error);
            toast.error('삭제에 실패했습니다.');
        }
    };

    const handleClearAllNotifications = async () => {
        if (!user) return;
        try {
            await deleteAllNotifications(user.id);
            queryClient.invalidateQueries(['notifications']);
            toast.success("모든 알림이 삭제되었습니다.");
        } catch (error) {
            toast.error("삭제 실패");
        }
    };

    const handleMarkAsRead = (id) => {
        markNotificationAsRead(id).then(() => {
             queryClient.invalidateQueries(['notifications']);
        });
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsRead(user.id);
            queryClient.invalidateQueries(['notifications']);
            toast.success("모든 알림을 읽음 처리했습니다.");
        } catch (error) {
            toast.error("처리 실패");
        }
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
                    <div className="content-grid" style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '12px',
                        padding: '10px 4px 20px 4px'
                    }}>
                        {savedPlaces.length > 0 ? savedPlaces.map(place => (
                            <div key={place.id} style={{ 
                                position: 'relative',
                                height: 'auto'
                            }}>
                                <div style={{ 
                                    transform: 'scale(0.85)', 
                                    transformOrigin: 'top left',
                                    width: '117.6%',
                                    marginBottom: '-15%'
                                }}>
                                    <RecommendationCard
                                        title={place.title}
                                        country={place.country}
                                        tag={place.tag}
                                        desc={place.description}
                                        image={place.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"}
                                        matchScore={place.match_score || 95}
                                        onClick={() => handlePlaceClick(place)}
                                    />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSavedPlace(place.id); }}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        background: 'rgba(255,255,255,0.92)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '22px',
                                        height: '22px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                        zIndex: 10
                                    }}
                                    title="삭제"
                                >
                                    ✕
                                </button>
                            </div>
                        )) : <div className="empty-state">저장된 장소가 없습니다.</div>}
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
                            <div key={item.id} className="feature-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedScheduleForDetail(item)}>
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
                            <div key={item.id} className="feature-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setSelectedScheduleForDetail(item)}>
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
                    <TravelStyleAnalysis 
                        savedPlaces={savedPlaces} 
                        upcomingSchedules={upcomingSchedules} 
                        pastSchedules={pastSchedules} 
                    />
                );
                case 'reviews': return (
                    <div className="reviews-container">
                        {selectedReview && (
                            <ReviewDetailModal
                                review={selectedReview}
                                onClose={() => setSelectedReview(null)}
                                onLike={async (id) => {
                                    const { liked } = await communityService.toggleLike(id, user.id);
                                    const updateData = (prev) => prev.map(p => p.id === id ? { ...p, is_liked: liked, likes: (p.likes || 0) + (liked ? 1 : -1) } : p);
                                    queryClient.setQueryData(['myReviews', user?.id], updateData);
                                    setSelectedReview(prev => prev.id === id ? { ...prev, is_liked: liked, likes: (prev.likes || 0) + (liked ? 1 : -1) } : prev);
                                }}
                                onEdit={(post) => {
                                    toast('수정 기능은 커뮤니티 페이지에서 이용해주세요.', { icon: 'ℹ️' });
                                }}
                                onDelete={(id) => {
                                    toast.promise(
                                        (async () => {
                                            await communityService.deletePost(id);
                                            queryClient.invalidateQueries(['myReviews', user?.id]);
                                            setSelectedReview(null);
                                        })(),
                                        {
                                            loading: '삭제 중...',
                                            success: '삭제되었습니다.',
                                            error: '삭제 실패',
                                        }
                                    );
                                }}
                                onUpdatePost={(updatedPost) => {
                                    queryClient.setQueryData(['myReviews', user?.id], (old) => {
                                        return old ? old.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p) : [];
                                    });
                                    setSelectedReview(prev => prev && prev.id === updatedPost.id ? { ...prev, ...updatedPost } : prev);
                                }}
                            />
                        )}
                        <div className="reviews-list">
                            {myReviews.length > 0 ? myReviews.map(item => (
                                <div key={item.id} className="review-card" onClick={() => setSelectedReview(item)}>
                                    <div className="review-card-thumb">
                                        <img src={item.thumb} alt={item.title} onError={(e) => e.target.src='https://via.placeholder.com/150'} />
                                    </div>
                                    <div className="review-card-content">
                                        <div className="review-card-rating-wrapper" style={{ marginBottom: '4px' }}>
                                            <div className="review-card-rating" style={{ display: 'flex', gap: '2px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} color={i < (item.rating || 0) ? "#fbbf24" : "#e5e7eb"} size={14} />
                                                ))}
                                            </div>
                                        </div>
                                        <h3 className="review-card-title" style={{ marginTop: 0 }}>{item.title}</h3>
                                        <p className="review-card-snippet">{item.content}</p>
                                        <div className="review-card-footer">
                                            <span className="review-date">{item.date}</span>
                                            <div className="review-card-stats" style={{ display: 'flex', gap: '10px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: item.is_liked ? '#ef4444' : '#9ca3af' }}>
                                                    {item.is_liked ? <FaHeart /> : <FaRegHeart />} {item.likes}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af' }}>
                                                    <FaComment /> {item.comments}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="empty-state">작성한 후기가 없습니다.</div>}
                        </div>
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
                            if (noti.type === 'save') { Icon = FaHeart; colorClass = 'pink'; }
                            if (noti.type === 'post') { Icon = FaPen; colorClass = 'blue'; } // Added post icon // Added save icon

                            return (
                                <div key={noti.id} className={`notification-card ${!noti.isRead ? 'unread' : ''}`} onClick={() => handleMarkAsRead(noti.id)}>
                                    <div className={`noti-icon-box ${colorClass}`}>
                                        <Icon />
                                    </div>
                                    <div className="noti-content-wrapper">
                                        <p className="noti-message">{noti.text}</p>
                                        <span className="noti-time">{noti.time}</span>
                                    </div>
                                    <div className="noti-right-actions">
                                        {!noti.isRead && <div className="noti-unread-dot"></div>}
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


            {/* 저장된 장소 상세 보기 Drawer */}
            <TripDetailDrawer
                open={!!selectedPlace}
                onClose={() => setSelectedPlace(null)}
                item={selectedPlace}
                nights={drawerNights}
                setNights={setDrawerNights}
                people={drawerPeople}
                setPeople={setDrawerPeople}
                planText={drawerPlanText}
                setPlanText={setDrawerPlanText}
                diffResult={drawerDiffResult}
                onImprove={handleImprovePlace}
                onSave={onSaveFromDrawer}
                improveLabel="AI 자동 제안"
            />
            {/* 일정 세부일정 상세 보기 Modal */}
            <AnimatePresence>
                {selectedScheduleForDetail && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ zIndex: 1100 }}
                        onClick={() => setSelectedScheduleForDetail(null)}
                    >
                        <motion.div
                            className="modal-content full"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                width: '95%', 
                                maxWidth: '800px', 
                                height: '90vh', 
                                padding: 0, 
                                overflow: 'hidden',
                                borderRadius: '24px 24px 0 0',
                                position: 'absolute',
                                bottom: 0
                            }}
                        >
                            <div className="modal-header-sticky" style={{ 
                                padding: '16px 20px', 
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'white'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>여행 세부일정</h3>
                                <button 
                                    onClick={() => setSelectedScheduleForDetail(null)}
                                    style={{ 
                                        background: '#f3f4f6', 
                                        border: 'none', 
                                        borderRadius: '50%', 
                                        width: '32px', 
                                        height: '32px', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >✕</button>
                            </div>
                            <div style={{ height: 'calc(100% - 65px)', overflowY: 'auto', padding: '0 0 40px 0' }}>
                                <ScheduleDetailView schedule={selectedScheduleForDetail} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
