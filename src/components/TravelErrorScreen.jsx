import { motion } from "framer-motion";
import { FiAlertTriangle, FiHome, FiRefreshCw, FiArrowLeft } from "react-icons/fi";
import { Toaster } from "react-hot-toast";

export default function TravelErrorScreen({ error, onAction }) {
  const isDev = import.meta?.env?.DEV;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% 10%, rgba(59,130,246,.25), transparent 60%), radial-gradient(900px 500px at 80% 30%, rgba(16,185,129,.20), transparent 55%), #0b1020",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: "min(720px, 100%)",
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(255,255,255,.04)",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          padding: 22,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(245,158,11,.16)",
              border: "1px solid rgba(245,158,11,.25)",
            }}
          >
            <FiAlertTriangle />
          </div>

          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.2 }}>
              여행이 잠시 길을 잃었어요
            </h1>
            <p style={{ marginTop: 6, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>
              페이지를 그리는 도중 예상치 못한 오류가 발생했어요.
              <br />
              아래 버튼으로 안전하게 돌아갈 수 있어요.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <ActionButton icon={<FiHome />} label="홈으로" onClick={() => onAction?.("home")} />
          <ActionButton icon={<FiRefreshCw />} label="새로고침" onClick={() => onAction?.("reload")} />
          <ActionButton icon={<FiArrowLeft />} label="뒤로가기" onClick={() => onAction?.("back")} />
        </div>

        {isDev && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", color: "rgba(255,255,255,.8)" }}>
              개발자용 에러 상세 보기
            </summary>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                background: "rgba(0,0,0,.35)",
                border: "1px solid rgba(255,255,255,.08)",
                overflowX: "auto",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
{String(error?.stack || error?.message || error)}
            </pre>
          </details>
        )}

        <p style={{ marginTop: 14, color: "rgba(255,255,255,.55)", fontSize: 12 }}>
          팁: 이런 오류는 대개 특정 페이지 컴포넌트의 런타임 에러에서 시작돼요. 콘솔 로그를 확인하면 더 빨리 잡을 수 있어요.
        </p>
      </motion.div>
      <Toaster position="top-center" />
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.06)",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
    </button>
  );
}
