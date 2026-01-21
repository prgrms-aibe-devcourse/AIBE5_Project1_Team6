import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ChatbotWidget from "./ChatbotWidget";

export default function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brand" onClick={() => nav("/")}>trip_plan</div>
        <nav className="nav">
          <button className={pathname === "/walk" ? "navBtn active" : "navBtn"} onClick={() => nav("/walk")}>Walk</button>
          <button className={pathname === "/traffic" ? "navBtn active" : "navBtn"} onClick={() => nav("/traffic")}>Traffic</button>
          <button className={pathname === "/airplane" ? "navBtn active" : "navBtn"} onClick={() => nav("/airplane")}>Airplane</button>
          <button className={pathname === "/plans" ? "navBtn active" : "navBtn"} onClick={() => nav("/plans")}>My Plans</button>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      {/* ✅ 어디 페이지든 오른쪽 아래 고정 */}
      <ChatbotWidget />
    </div>
  );
}