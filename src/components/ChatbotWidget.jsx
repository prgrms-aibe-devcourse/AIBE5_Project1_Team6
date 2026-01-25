import { useEffect, useRef, useState } from "react";
import { useTripStore } from "../stores/tripStore";
import "../styles/chatbot.css";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const { mood, themes, destination } = useTripStore();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Initialize Greeting
  useEffect(() => {
    let greeting = "여행지 추천을 해드릴게요! 어디로 떠나고 싶나요? 🙂";
    if (mood || destination) {
        const moodText = mood ? `[${mood}] 기분` : '';
        const placeText = destination ? `[${destination}]` : '';
        greeting = `안녕하세요! ${placeText} ${moodText} 여행을 계획 중이시군요? ✈️\n무엇을 도와드릴까요? (맛집, 숙소, 코스 등)`;
    }
    setMessages([{ role: "bot", text: greeting }]);
  }, [mood, destination]); 

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Enhanced Rule-based Simulation
  const generateSmartReply = (input) => {
    const t = input.toLowerCase();
    
    // 1. Greetings
    if (t.match(/안녕|하이|ㅎㅇ|반가|hello|hi/)) {
        const greetings = [
            "안녕하세요! 여행 코스를 짜드리러 왔어요. ✈️",
            "반갑습니다! 오늘도 떠나기 딱 좋은 날씨네요. ☀️",
            destination ? `안녕하세요! ${destination} 여행 준비는 잘 돼가시나요?` : "안녕하세요! 어디로 떠날 계획이신가요?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. Contextual Keywords
    if (t.includes("추천") || t.includes("뭐해") || t.includes("도와")) {
        if (themes?.length > 0) return `선택하신 '${themes.join(', ')}' 테마에 맞춰서 숨은 명소를 찾아봐 드릴까요? 🕵️`;
        if (mood) return `'${mood}' 기분에 딱 맞는 드라이브 코스가 준비되어 있어요!`;
        return "원하시는 지역이나 테마(힐링, 맛집 등)를 말씀해주시면 바로 찾아드릴게요!";
    }

    if (t.includes("맛집") || t.includes("배고") || t.includes("식사")) {
        return `여행의 묘미는 역시 식도락이죠! 🍜 ${destination || '이 근처'}의 현지인 맛집 리스트를 뽑아드릴까요?`;
    }

    if (t.includes("숙소") || t.includes("잠") || t.includes("호텔")) {
        return "잠자리가 편해야 여행이 즐겁죠. 🛌 호캉스, 펜션, 감성 숙소 중 어떤 스타일을 선호하세요?";
    }

    if (t.includes("비용") || t.includes("돈") || t.includes("예산")) {
        return "가성비 여행부터 럭셔리 여행까지 다 가능해요. 💰 생각하시는 1인당 예산을 알려주시면 맞춰볼게요!";
    }

    // 3. Fallback Varied Responses
    const fallbacks = [
        "음, 조금 더 자세히 말씀해 주시겠어요? 예: '제주도 2박3일 코스 짜줘'",
        "제가 할 수 있는 건 맛집 추천, 코스 설계, 예산 분석이에요! 무엇이 궁금하신가요? 🤔",
        "아직 배우는 중이라 어려운 말은 잘 몰라요. 😅 '강릉 맛집' 처럼 단어로 말씀해 주시면 찰떡같이 알아들을게요!",
        "좋은 여행 계획에는 좋은 질문이 필요하죠! 어디로 가시는지부터 알려주세요."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    setTimeout(() => {
      const reply = generateSmartReply(text);
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    }, 600 + Math.random() * 500); 
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
              onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send();
                  }
              }}
            />
            <button onClick={send}>전송</button>
          </div>
        </div>
      )}
    </>
  );
}