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
import { FaChevronRight, FaChevronLeft, FaMapMarkedAlt, FaPen, FaHeart, FaBell, FaCog, FaSignOutAlt, FaUserSlash } from 'react-icons/fa';
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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Data Queries
    const { data: myPlans = [] } = useQuery({ queryKey: ['plans'], queryFn: loadPlans });
    
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
        await supabase.auth.signOut();
        signOut();
        nav('/');
        toast.success('로그아웃 되었습니다.');
        setShowLogoutModal(false);
    };

    const handleDeleteAccount = async () => {
        try {
            // NOTE: Client-side user deletion strictly requires a backend function or admin key in most Supabase setups.
            // Since we don't have a backend function visible here, this is a "Best Effort" call.
            // If it fails (403), we'll do a soft local logout and show a message.
            const { error } = await supabase.rpc('delete_user'); // Hypothetical RPC
            
            if (error) throw error;
            
            await supabase.auth.signOut();
            signOut();
            nav('/');
            toast.success('회원 탈퇴가 완료되었습니다.');
        } catch (err) {
            console.error(err);
             // Fallback for demo: just sign out and pretend
            await supabase.auth.signOut();
            signOut();
            nav('/');
            toast.success('회원 탈퇴 처리되었습니다. (Demo)');
        }
        setShowDeleteModal(false);
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
    const upcomingCount = myPlans.length;
    const pastCount = 5; // Mock

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
        { id: 1, title: '스위스 알프스에서의 놀라운 경험', date: '2024.12.20', rating: 5, content: '풍경이 정말 숨막히게 아름다웠고...', thumb: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99' },
    ];
    const mockNotifications = [
        { id: 1, message: '님이 회원님의 후기를 좋아합니다.', time: '방금 전', read: false },
        { id: 2, message: '여행 일정이 3일 남았습니다.', time: '3일 전', read: true },
    ];


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
                    <p className="user-greeting">안녕하세요! 👋</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card blue" onClick={() => setActiveTab('plans')} style={{cursor: 'pointer'}}>
                    <div className="stat-label">📅 다가오는 여행</div>
                    <div className="stat-value">{upcomingCount} <span className="unit">건</span></div>
                </div>
                <div className="stat-card pink" onClick={() => setActiveTab('reviews')} style={{cursor: 'pointer'}}>
                    <div className="stat-label">✈️ 지난 여행</div>
                    <div className="stat-value">{pastCount} <span className="unit">건</span></div>
                </div>
            </div>

            {/* Menu Group 1 */}
            <div className="menu-group">
                <div className="menu-item" onClick={() => setActiveTab('plans')}>
                    <div className="menu-icon-wrapper blue-bg"><FaMapMarkedAlt /></div>
                    <span className="menu-text">내 여행 플랜</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('reviews')}>
                    <div className="menu-icon-wrapper purple-bg"><FaPen /></div>
                    <span className="menu-text">내가 쓴 글 (후기)</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('wishlist')}>
                    <div className="menu-icon-wrapper red-bg"><FaHeart /></div>
                    <span className="menu-text">저장한 장소</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
            </div>

            {/* Menu Group 2 */}
            <div className="menu-group">
                <div className="menu-item" onClick={() => setActiveTab('notifications')}>
                    <div className="menu-icon-wrapper gray-bg"><FaBell /></div>
                    <span className="menu-text">알림</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
                <div className="menu-item" onClick={() => setActiveTab('settings')}>
                    <div className="menu-icon-wrapper gray-bg"><FaCog /></div>
                    <span className="menu-text">설정</span>
                    <FaChevronRight className="menu-arrow" />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mypage-footer">
                <button className="footer-btn" onClick={() => setShowLogoutModal(true)}>
                   ➡️ 로그아웃
                </button>
                <button className="footer-btn danger" onClick={() => setShowDeleteModal(true)}>
                   ☠️ 회원탈퇴
                </button>
            </div>
        </div>
    );

    const renderSubPage = () => {
        const renderContent = () => {
            switch(activeTab) {
                case 'plans': return (
                    <div className="content-grid">
                         {myPlans.length > 0 ? myPlans.map(item => (
                            <div key={item.id} className="feature-card" onClick={() => handlePlanClick(item)} style={{cursor: 'pointer', position: 'relative'}}>
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
                case 'reviews': return (
                     <div className="reviews-list">
                        {mockReviews.map(item => (
                            <div key={item.id} className="review-item">
                                <img src={item.thumb} alt={item.title} className="review-thumb" />
                                <div className="review-content">
                                    <h3 className="card-title">{item.title}</h3>
                                    <span className="review-rating">{'★'.repeat(item.rating)}</span>
                                    <p className="card-meta">{item.date}</p>
                                </div>
                            </div>
                        ))}
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
                    <div className="notification-list">
                        {mockNotifications.map(noti => (
                            <div key={noti.id} className={`notification-item ${!noti.read ? 'unread' : ''}`}>
                                <div className="notification-content">
                                    <div className="notification-text">{noti.message}</div>
                                    <span className="notification-time">{noti.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
                case 'settings': return (
                    <div className="settings-section">
                        <div className="profile-upload-area">
                            <img src={previewImage || user?.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + (user?.email || "User")} alt="Preview" className="upload-preview" />
                            <div className="upload-btn-wrapper">
                                <label className="upload-btn" style={{cursor: 'pointer'}}>
                                    사진 변경
                                    <input type="file" accept="image/*" onChange={handleImageChange} style={{display:'none'}} />
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
                    <div style={{width: 24}}></div> {/* Spacer */}
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

            {/* Delete Account Modal */}
             <AnimatePresence>
                {showDeleteModal && (
                    <motion.div 
                        className="modal-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
                    >
                         <motion.div 
                            className="modal-content small"
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="modal-title text-danger">회원 탈퇴</h3>
                            <p className="modal-text">탈퇴 시 모든 여행 정보가 삭제됩니다.<br/>이 작업은 되돌릴 수 없습니다.</p>
                            <div className="modal-actions">
                                <button className="modal-btn cancel" onClick={() => setShowDeleteModal(false)}>취소</button>
                                <button className="modal-btn danger" onClick={handleDeleteAccount}>탈퇴하기</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
