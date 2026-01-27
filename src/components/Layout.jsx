import { useNavigate, useLocation, Outlet } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
import { useAuthStore } from "../stores/authStore";
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import { supabase } from "../services/supabase";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { useTripStore } from "../stores/tripStore"; // Added

import { FiUser, FiMessageSquare, FiEdit, FiLogOut, FiLogIn, FiMenu } from "react-icons/fi";

// Hamburger Menu Component
function HamburgerMenu({ user, nav, handleLogout, setShowAuth }) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { icon: <FiUser />, label: '마이페이지', onClick: () => { nav('/mypage'); setIsOpen(false); } },
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
                            zIndex: 999
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
                            zIndex: 1000,
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
                                onClick={() => { handleLogout(); setIsOpen(false); }}
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
  const { user, isGuest, guestId } = useAuthStore();
  const { reset } = useTripStore(); // Added
  const [showAuth, setShowAuth] = useState(false);

  const isHome = location.pathname === '/';
  const isCommunity = location.pathname.startsWith('/community');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // User stays on current page after logout as requested
    // Toast removed as requested
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

  const handleLogoClick = () => {
      // If user is logged in, go to last used mode (Walk/Traffic/Airplane)
      // If logged out, go to initial page (Home)
      if (user) {
          const lastMode = sessionStorage.getItem('lastMainMode');
          nav(lastMode || '/walk');
      } else {
          nav('/');
      }
  };

  return (
    <div className="appShell">
      <AnimatePresence>
        {!isHome && (
          <motion.header 
            className="topbar" 
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }} // Smooth easeOutCubic
            style={{ 
                backgroundColor: 'white', 
                borderBottom: '1px solid #f0f0f0',
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}
          >
            <div className="global-layout-container topbar-inner" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
                {/* Left Group: Logo */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div 
                        className="brand" 
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={handleLogoClick}
                    >
                        <img src="/title.jpg" alt="Walk2Fly" style={{ height: '36px' }} />
                    </div>
                </div>

                {/* Center Group: Mode Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                    <ModeTab path="/walk" label="Walk" />
                    <Separator />
                    <ModeTab path="/traffic" label="Drive" />
                    <Separator />
                    <ModeTab path="/airplane" label="Airplane" />
                </div>

                {/* Right Group: Hamburger Menu */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                    <HamburgerMenu 
                        user={user} 
                        nav={nav} 
                        handleLogout={handleLogout} 
                        setShowAuth={setShowAuth} 
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

      <Toaster position="top-center" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}