import { useNavigate, useLocation, Outlet } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
import { useAuthStore } from "../stores/authStore";
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { supabase } from "../services/supabase";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPromptModal from "./LoginPromptModal";

import { useTripStore } from "../stores/tripStore"; // Added

import { FiUser, FiMessageSquare, FiEdit, FiLogOut, FiLogIn, FiMenu } from "react-icons/fi";

// Hamburger Menu Component
function HamburgerMenu({ user, nav, handleLogout, setShowAuth, setShowLoginPrompt, setShowLogoutModal }) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { 
            icon: <FiUser />, 
            label: '마이페이지', 
            onClick: () => { 
                if (!user) {
                    setShowLoginPrompt(true);
                } else {
                    nav('/mypage'); 
                }
                setIsOpen(false); 
            } 
        },
        { icon: <FiMessageSquare />, label: '커뮤니티', onClick: () => { nav('/community'); setIsOpen(false); } },
        { icon: <FiEdit />, label: '일정관리', onClick: () => { nav('/planlab'); setIsOpen(false); } },
    ];

    return (
        <div style={{ position: 'relative' }}>
            {/* Hamburger Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F0F7FF'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
                <FiMenu size={24} color="#5C94FF" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay to close menu */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e0e0e0',
                            minWidth: '180px',
                            zIndex: 9999,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Auth Button - At Top for non-logged in users */}
                        {!user && (
                            <button
                                onClick={() => { setShowAuth(true); setIsOpen(false); }}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: 'none',
                                    background: '#F0F7FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: '#5C94FF',
                                    fontWeight: '600',
                                    borderBottom: '1px solid #e0e0e0'
                                }}
                            >
                                <FiLogIn /> 로그인 / 회원가입
                            </button>
                        )}

                        {/* Menu Items */}
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: 'none',
                                    background: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: '#333',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#F0F7FF'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                <span style={{ color: '#5C94FF' }}>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                            {/* Logout - Only for logged in users at bottom */}
                            {user && (
                                <button
                                    onClick={() => { setShowLogoutModal(true); setIsOpen(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        background: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: '#ef4444',
                                        borderTop: '1px solid #f0f0f0'
                                    }}
                                >
                                    <FiLogOut /> 로그아웃
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }
    
    export default function Layout() {
        const nav = useNavigate();
        const location = useLocation();
        const { user, isGuest, guestId, showAuth, setShowAuth, showLoginPrompt, setShowLoginPrompt } = useAuthStore();
        const { reset } = useTripStore();
        const [showLogoutModal, setShowLogoutModal] = useState(false);
    
        const isHome = location.pathname === '/';
        const isCommunity = location.pathname.startsWith('/community');
    
        const handleLogout = async () => {
            await supabase.auth.signOut();
            nav('/'); // Redirect to home/login page
            reset(); // Reset trip store
            toast.success('로그아웃 되었습니다.');
            setShowLogoutModal(false);
        };
    
        const navButtonStyle = {
            background: 'none',
            border: 'none',
            color: '#5C94FF',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background 0.2s'
        };
    
        const hoverStyle = (e) => e.target.style.backgroundColor = '#F0F7FF';
        const unhoverStyle = (e) => e.target.style.backgroundColor = 'transparent';
    
        // Mode Tab Helper
        const ModeTab = ({ path, label }) => {
            const isActive = location.pathname === path;
            return (
                <span
                    onClick={() => nav(path)}
                    style={{
                        cursor: 'pointer',
                        fontWeight: isActive ? '800' : '400',
                        color: isActive ? '#1a1a1a' : '#999',
                        fontSize: '1rem',
                        borderBottom: isActive ? '2px solid #1a1a1a' : '2px solid transparent', // Added visual indicator
                        paddingBottom: '2px', // spacing for underline
                        transition: 'all 0.2s'
                    }}
                >
                    {label}
                </span>
            );
        };
    
        const Separator = () => <span style={{ color: '#ddd', fontSize: '0.8rem' }}>|</span>;
    
        // Track Last Main Mode
        useEffect(() => {
            if (['/walk', '/traffic', '/airplane'].includes(location.pathname)) {
                sessionStorage.setItem('lastMainMode', location.pathname);
            }
        }, [location.pathname]);
    
        // 로그아웃 상태에서 보호된 페이지 접근 시 홈으로 리다이렉트
        const publicRoutes = ['/', '/walk', '/traffic', '/airplane', '/login', '/planlab', '/community'];
        useEffect(() => {
            if (!user && !isGuest && !publicRoutes.includes(location.pathname)) {
                nav('/', { replace: true });
            }
        }, [user, isGuest, location.pathname, nav]);
    
        const handleLogoClick = () => {
            if (user && !isGuest) {
                const lastMode = sessionStorage.getItem('lastMainMode');
                nav(lastMode || '/walk');
            } else {
                reset(); // Ensure funnel is reset to step 0
                nav('/');
            }
        };
    
        return (
            <div className="appShell">
                <AnimatePresence>
                    {!isHome && (
                        <motion.header
                            className="topbar"
                            style={{ zIndex: 10000 }}
                            initial={{ y: -80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -80, opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }} // Smooth easeOutCubic
                        >
                            <div className="global-layout-container topbar-inner">
                                {/* Left Group: Logo & Navigation */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                                    <div
                                        className="brand"
                                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                        onClick={handleLogoClick}
                                    >
                                        <img src="/title.jpg" alt="Walk2Fly" style={{ height: '36px' }} />
                                    </div>
    
                                    {/* Navigation Tabs (Moved from center) */}
                                    <div className="nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                        <ModeTab path="/walk" label="Walk" />
                                        <ModeTab path="/traffic" label="Drive" />
                                        <ModeTab path="/airplane" label="Airplane" />
                                    </div>
                                </div>
    
                                {/* Right Group: Hamburger Menu */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <HamburgerMenu
                                        user={user}
                                        nav={nav}
                                        handleLogout={handleLogout}
                                        setShowAuth={setShowAuth}
                                        setShowLoginPrompt={setShowLoginPrompt}
                                        setShowLogoutModal={setShowLogoutModal}
                                    />
                                </div>
                            </div>
                        </motion.header>
                    )}
                </AnimatePresence>
    
                <main className={`content ${!isHome ? 'global-layout-container' : ''}`}>
                    <Outlet />
                </main>
    
                {/* ✅ 어디 페이지든 오른쪽 아래 고정 (홈 제외) */}
                {!isHome && !isCommunity && <ChatbotWidget />}
    
                <Toaster position="top-center" containerStyle={{ zIndex: 99999 }} />
                {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
                <LoginPromptModal 
                    isOpen={showLoginPrompt} 
                    onClose={() => setShowLoginPrompt(false)} 
                />
                
                 {/* Logout Modal - Global */}
                 <AnimatePresence>
                    {showLogoutModal && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 11000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <motion.div
                                className="modal-content small"
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    background: 'white',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    textAlign: 'center',
                                    width: '90%',
                                    maxWidth: '320px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 12px 0', color: '#111' }}>벌써 가시려구요? 😢</h3>
                                <p style={{ fontSize: '1rem', color: '#6b7280', margin: '0 0 24px 0' }}>가실거에요? 더 둘러보고 가세요</p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* Gray button for actual logout (Secondary action) */}
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                                            fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                                            background: '#f3f4f6', color: '#374151'
                                        }}
                                    >
                                        로그아웃하기
                                    </button>
                                    {/* Blue button to stay (Primary action) */}
                                    <button 
                                        onClick={() => setShowLogoutModal(false)}
                                        style={{
                                            flex: 1, padding: '14px', borderRadius: '14px', border: 'none',
                                            fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                                            background: '#3b82f6', color: 'white'
                                        }}
                                    >
                                        좀더 보고가기
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }