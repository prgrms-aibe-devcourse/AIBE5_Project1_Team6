import { useNavigate, useLocation, Outlet } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
import { useAuthStore } from "../stores/authStore";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { supabase } from "../services/supabase";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { useTripStore } from "../stores/tripStore"; // Added

import { FiUser, FiMessageSquare, FiEdit, FiLogOut, FiLogIn } from "react-icons/fi";

export default function Layout() {
  const nav = useNavigate();
  const location = useLocation();
  const { user, isGuest, guestId } = useAuthStore();
  const { reset } = useTripStore(); // Added
  const [showAuth, setShowAuth] = useState(false);

  const isHome = location.pathname === '/';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("/");
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
            <div 
                className="brand" 
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <img src="/title.jpg" alt="Walk2Fly" style={{ height: '28px' }} />
            </div>

            {/* Mode Switcher */}
            <div style={{ marginLeft: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <ModeTab path="/walk" label="Walk" />
                <Separator />
                <ModeTab path="/traffic" label="Traffic" />
                <Separator />
                <ModeTab path="/airplane" label="Airplane" />
            </div>

            <nav className="nav" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button 
                    className="navBtn" 
                    onClick={() => nav('/mypage')} 
                    style={navButtonStyle}
                    onMouseEnter={hoverStyle} onMouseLeave={unhoverStyle}
                >
                    <FiUser /> 마이페이지
                </button>
                
                <button 
                    className="navBtn" 
                    onClick={() => nav('/reviews')} 
                    style={navButtonStyle}
                    onMouseEnter={hoverStyle} onMouseLeave={unhoverStyle}
                >
                    <FiMessageSquare /> 후기
                </button>
                
                <button 
                    className="navBtn" 
                    onClick={() => nav('/planlab')} 
                    style={navButtonStyle}
                    onMouseEnter={hoverStyle} onMouseLeave={unhoverStyle}
                >
                    <FiEdit /> 일정관리
                </button>
            </nav>

        <div style={{ paddingRight: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 'bold' }}>
                {user.email.split('@')[0]}님, 환영합니다.
              </span>
              <button 
                className="navBtn" 
                onClick={handleLogout} 
                style={{ ...navButtonStyle, color: '#1a1a1a' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'} 
                onMouseLeave={unhoverStyle}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          ) : isGuest ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontWeight: 'bold' }}>
                비회원{guestId}님, 환영합니다.
              </span>
              <button 
                  className="navBtn" 
                  onClick={() => setShowAuth(true)} 
                  style={{ ...navButtonStyle, color: '#1a1a1a' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'} 
                  onMouseLeave={unhoverStyle}
              >
                  <FiLogIn /> Login
              </button>
            </div>
          ) : (
            <button 
                className="navBtn" 
                onClick={() => setShowAuth(true)} 
                style={navButtonStyle}
                onMouseEnter={hoverStyle} onMouseLeave={unhoverStyle}
            >
                <FiLogIn /> Login
            </button>
          )}
        </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="content">
        <Outlet />
      </main>

      {/* ✅ 어디 페이지든 오른쪽 아래 고정 */}
      <ChatbotWidget />

      <Toaster position="top-center" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}