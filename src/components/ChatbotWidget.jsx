import { useEffect, useRef, useState } from "react";
import "../styles/chatbot.css";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "여행지 추천을 해드릴게요! 어디로 떠나고 싶나요? 🙂" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    // ✅ 지금은 룰 기반(나중에 AI API로 교체)
    const reply =
      text.includes("서울") ? "서울이면 한강 야경 코스 + 성수/연남 카페라인 추천!" :
      text.includes("경주") ? "경주는 황리단길 + 첨성대 + 야경동궁월지 코스가 좋아요." :
      "좋아요! 여행 기간/예산/동행(혼자/커플/가족) 알려주면 더 딱 맞게 추천할게요.";

    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 250);
  };

  return (
    <>
      <button className="chatFab" onClick={() => setOpen((v) => !v)}>
        {open ? "×" : "AI"}
      </button>

      {open && (
        <div className="chatWindow">
          <div className="chatHeader">
            <div className="chatTitle">Trip AI</div>
            <button className="chatClose" onClick={() => setOpen(false)}>닫기</button>
          </div>

          <div className="chatBody">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="chatInputRow">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 2박3일, 예산 30만원, 바다 좋아해요"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send}>전송</button>
          </div>
        </div>
      )}
    </>
  );
}