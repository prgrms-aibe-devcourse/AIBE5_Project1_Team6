import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Walk from "./pages/Walk";
import Traffic from "./pages/Traffic";
import Airplane from "./pages/Airplane";

import PlanLab from "./pages/PlanLab";
// import Plans from "./pages/Plans";
import Community from "./pages/Community";
import MyPage from "./pages/MyPage";
import { useEffect } from "react";
import { supabase } from "./services/supabase";
import { useAuthStore } from "./stores/authStore";

import { useTripStore } from "./stores/tripStore";

import AuthPage from "./pages/AuthPage";

export default function App() {
  const { setSession, setUser } = useAuthStore();
  const { reset: resetTrip } = useTripStore();

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // 세션이 없으면 (로그아웃 상태) trip 상태 초기화
      if (!session) {
        resetTrip();
      }
    });

    // 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // 로그아웃 시 trip 상태 초기화
      if (!session) {
        resetTrip();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, resetTrip]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/walk" element={<Walk />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/airplane" element={<Airplane />} />
        <Route path="/planlab" element={<PlanLab />} />
        {/* <Route path="/plans" element={<Plans />} /> */}
        <Route path="/community" element={<Community />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<AuthPage />} />
      </Route>
    </Routes>
  );
}