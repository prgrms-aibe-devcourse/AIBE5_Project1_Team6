import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";
import { useAuthStore } from "../stores/authStore";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { supabase } from "../services/supabase";
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("로그아웃 되었습니다.");
  };

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand" onClick={() => nav("/")}>trip_plan</div>
        <nav className="nav">
          <button className={pathname === "/walk" ? "navBtn active" : "navBtn"} onClick={() => nav("/walk")}>Walk</button>
          <button className={pathname === "/traffic" ? "navBtn active" : "navBtn"} onClick={() => nav("/traffic")}>Traffic</button>
          <button className={pathname === "/airplane" ? "navBtn active" : "navBtn"} onClick={() => nav("/airplane")}>Airplane</button>

          <button className={pathname === "/planlab" ? "navBtn active" : "navBtn"} onClick={() => nav("/planlab")}>PlanLab</button>
        </nav>

        <div style={{ marginLeft: "auto", paddingRight: 20 }}>
          {user ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#aaa' }}>{user.email.split('@')[0]}님</span>
              <button className="navBtn" onClick={handleLogout} style={{ fontSize: 13, padding: "4px 8px" }}>Logout</button>
            </div>
          ) : (
            <button className="navBtn" onClick={() => setShowAuth(true)} style={{ fontSize: 13, background: "#3b82f6", border: 'none', color: 'white' }}>Login</button>
          )}
        </div>
      </header>

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