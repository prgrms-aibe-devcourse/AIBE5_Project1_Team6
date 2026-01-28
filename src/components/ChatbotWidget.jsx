import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";
import { useTripStore } from "../stores/tripStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../services/supabase";
import { addSchedule } from "../services/schedulesStorage";
import "../styles/chatbot.css";
import { FiMessageSquare, FiX } from "react-icons/fi";
import LoginPromptModal from "./LoginPromptModal";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { mood, themes, destination } = useTripStore();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingItinerary, setPendingItinerary] = useState(null); // 저장 대기 중인 일정
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const endRef = useRef(null);
  const roomIdRef = useRef(null);

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const MODEL_ID = "gemini-3-flash-preview"; // Full model path format

  const { user } = useAuthStore();

  console.log("[ChatBot] Current State:", { mood, destination, themes });

  const genAI = useMemo(() => {
    if (!GEMINI_API_KEY) {
      console.warn("[ChatBot] Gemini API Key 없음");
      return null;
    }
    try {
      console.log("[ChatBot] Gemini 클라이언트 생성 중...");
      return new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (err) {
      console.error("Gemini 클라이언트 생성 실패", err);
      return null;
    }
  }, [GEMINI_API_KEY]);


  // Initialize Greeting
  useEffect(() => {
    const greeting = "안녕하세요! 여행을 계획 중이시군요?\n무엇을 도와드릴까요?";
    setMessages([{ role: "bot", text: greeting }]);
  }, []);

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

  const ensureRoom = async () => {
    if (roomIdRef.current || !user) return roomIdRef.current;
    try {
      const { data, error } = await supabase
        .from("chat_room")
        .insert([{ user_id: user.id }])
        .select("id")
        .single();
      if (error) throw error;
      roomIdRef.current = data.id;
      return data.id;
    } catch (err) {
      console.error("chat_room 생성 실패", err);
      return null;
    }
  };

  const saveMessage = async (role, content) => {
    if (!user) return;
    const roomId = roomIdRef.current || (await ensureRoom());
    if (!roomId) return;
    try {
      await supabase.from("chat_message").insert({
        room_id: roomId,
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.error("chat_message 저장 실패", err);
    }
  };

  const resetChat = async () => {
    const roomId = roomIdRef.current;
    setMessages([{ role: "bot", text: "대화를 새로 시작해요. 무엇을 도와드릴까요?" }]);
    if (!roomId || !user) return;
    try {
      await supabase.from("chat_message").delete().eq("room_id", roomId);
      await supabase.from("chat_room").delete().eq("id", roomId);
    } catch (err) {
      console.error("채팅 초기화 실패", err);
    }
    roomIdRef.current = null;
  };

  const callGemini = async (text) => {
    if (!GEMINI_API_KEY || !genAI) {
      console.warn("[ChatBot] Gemini 호출 불가: API Key나 클라이언트 없음");
      return null;
    }

    console.log("[ChatBot] Gemini 호출 시작:", text);

    const history = messages
      .slice(-6)
      .map((m) => `${m.role === "bot" ? "assistant" : "user"}: ${m.text}`)
      .join("\n");

    const context = [
      mood ? `기분: ${mood}` : null,
      themes?.length ? `테마: ${themes.join(", ")}` : null,
      destination ? `여행지: ${destination}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // Current date for context
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDate = today.getDate();
    const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDate).padStart(2, '0')}`;
    
    // Future date example (1 week from now)
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    const futureStartStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;
    
    // End date example (4 days after start)
    const futureEndDate = new Date(futureDate);
    futureEndDate.setDate(futureDate.getDate() + 3);
    const futureEndStr = `${futureEndDate.getFullYear()}-${String(futureEndDate.getMonth() + 1).padStart(2, '0')}-${String(futureEndDate.getDate()).padStart(2, '0')}`;

    const prompt = `너는 한국어 여행 플래너 챗봇이다.
컨텍스트: ${context || "정보 없음"}

**현재 날짜: ${todayStr}**
**중요**: 일정을 추천할 때는 반드시 오늘 날짜(${todayStr}) 이후의 날짜를 사용해야 한다.
또한, 사용자가 예산을 언급하지 않았다면 '적당한(mid)' 예산 기준으로, 언급했다면 그에 맞춰 **비용(KRW)을 추산**해라.

최근 대화:
${history}
사용자 요청: ${text}

중요: 사용자가 여행 일정을 요청하면 (예: "제주도 3박4일 일정 짜줘"), 반드시 다음 JSON 형식으로 답변해야 한다.
**각 명소의 예상 비용과 전체 여행 경비**를 포함해야 한다.

\`\`\`json
{
  "type": "itinerary",
  "destination": "제주도",
  "destinationEmoji": "🏝️",
  "startDate": "${futureStartStr}",
  "endDate": "${futureEndStr}",
  "people": 2,
  "title": "제주도 힐링 여행",
  "totalEstimatedCost": 450000,
  "dailySchedule": [
    {
      "day": 1,
      "date": "${futureStartStr}",
      "spots": [
        {"time": "09:00", "emoji": "✈️", "spot": "제주 공항", "activity": "제주 도착", "cost": 0, "costDescription": "항공권 제외"},
        {"time": "12:00", "emoji": "🍜", "spot": "자매국수", "activity": "점심 식사", "cost": 12000, "costDescription": "식비"}
      ]
    }
  ]
}
\`\`\`

**중요**: destinationEmoji는 목적지에 가장 어울리는 이모지를 선택해야 한다.
예시:
- 제주도 → 🏝️
- 부산 → 🌊
- 서울 → 🏙️

일정이 아닌 질문(맛집 추천, 숙소 추천 등)은 친절하게 짧게 답변해줘.
규칙:
1) 한국어로 3~5문장 이내로 간결하게.
2) 각 항목이나 주제마다 줄바꿈(\\n)을 포함해서 가독성 있게 작성.
3) 요청이 일정/체크리스트/예산/문제해결(분실, 숙박, 불편 신고) 관련이면 짧게 액션 아이템 위주로.`;

    console.log("[ChatBot] 프롬프트:", prompt);

    // 재시도 로직 (최대 3회)
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`[ChatBot] Gemini API 호출 중... (재시도: ${4 - retries}/3)`);
        const model = genAI.getGenerativeModel({ model: MODEL_ID });
        const result = await model.generateContent(prompt);

        console.log("[ChatBot] Gemini 응답 전체:", result);

        // 여러 가능성 시도
        let text = null;

        // 1. candidates 직접 접근
        if (result.response?.candidates?.length > 0) {
          text = result.response.candidates[0].content.parts[0].text;
          console.log("[ChatBot] 시도1 (candidates):", text);
        }

        // 2. response.text() 메서드
        if (!text && result.response && typeof result.response.text === "function") {
          text = result.response.text();
          console.log("[ChatBot] 시도2 (response.text()):", text);
        }

        // 3. response 직접 접근
        if (!text) {
          text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log("[ChatBot] 시도3 (response.candidates):", text);
        }

        console.log("[ChatBot] 최종 추출된 응답:", text);
        return text || null;
      } catch (err) {
        retries--;
        console.error(`[ChatBot] Gemini 호출 실패 (남은 재시도: ${retries}):`, err.message);

        // 503 또는 429 에러면 재시도, 나머지는 바로 실패
        if ((err.message?.includes("503") || err.message?.includes("429")) && retries > 0) {
          const waitTime = Math.pow(2, 3 - retries) * 1000; // 지수 백오프: 2s, 4s
          console.log(`[ChatBot] ${waitTime}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 최종 실패
        console.error("[ChatBot] 최종 실패:", err.message);
        return null;
      }
    }

    return null;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!user) {
      setIsPromptOpen(true);
      return;
    }

    console.log("[ChatBot] 사용자 메시지:", text);
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    
    // 저장 대기 중인 일정이 있는 경우 확인 응답 체크
    if (pendingItinerary) {
      const affirmative = /^(예|응|넹|네|yes|ok|오케이|알겠|확인|저장)/i.test(text);
      const negative = /^(아니|no|취소|안할|싫)/i.test(text);
      
      if (affirmative) {
        setLoading(true);
        await actualSaveToSchedules(pendingItinerary);
        setPendingItinerary(null);
        setMessages((m) => [...m, { role: "bot", text: "✅ 일정이 저장되었습니다!\n일정관리 페이지에서 확인해주세요. 🎉" }]);
        setLoading(false);
        return;
      } else if (negative) {
        setPendingItinerary(null);
        setMessages((m) => [...m, { role: "bot", text: "알겠습니다. 일정 저장을 취소했어요." }]);
        return;
      } else {
        setMessages((m) => [...m, { role: "bot", text: "죄송해요, 잘 이해하지 못했어요. 😅\n일정을 저장하시려면 '예' 또는 '확인'이라고 말씀해주세요.\n취소하시려면 '아니요' 또는 '취소'라고 해주세요." }]);
        return;
      }
    }

    setLoading(true);
    await saveMessage("user", text);

    const aiReply = await callGemini(text);
    const reply = aiReply || generateSmartReply(text);

    console.log("[ChatBot] 최종 응답:", reply);

    // JSON 파싱 시도
    let itineraryData = null;
    let displayReply = reply;

    try {
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.type === "itinerary") {
          itineraryData = parsed;
          console.log("[ChatBot] 일정 데이터 파싱 성공:", itineraryData);

          // JSON 코드블럭 제거
          displayReply = reply.replace(/```json[\s\S]*?```/, '').trim();

          // 일정 요약 메시지 추가
          const nights = itineraryData.dailySchedule.length - 1;
          const totalSpots = itineraryData.dailySchedule.reduce((sum, day) => sum + day.spots.length, 0);
          const totalCostStr = itineraryData.totalEstimatedCost ? `\n💰 총 예상 비용: ${itineraryData.totalEstimatedCost.toLocaleString()}원` : "";
          const summary = `\n\n📅 ${itineraryData.destination} ${nights}박${itineraryData.dailySchedule.length}일 일정이 준비되었습니다!${totalCostStr}\n총 ${totalSpots}개의 명소를 방문합니다.\n\n아래 버튼을 눌러 일정을 저장하세요! ⬇️`;

          displayReply = displayReply + summary;
        }
      }
    } catch (err) {
      console.log("[ChatBot] JSON 파싱 실패 (일반 텍스트 응답):", err.message);
    }

    setMessages((m) => [...m, { role: "bot", text: displayReply, itineraryData }]);
    await saveMessage("assistant", displayReply);
    setLoading(false);
  };

  const saveToSchedules = async (itineraryData) => {
    // 버튼 클릭 시 즉시 저장 및 이동
    await actualSaveToSchedules(itineraryData);
  };

  const actualSaveToSchedules = async (itineraryData) => {
    try {
      // JSON 형식으로 저장하여 비용 및 상세 정보 보존
      const scheduleText = JSON.stringify(itineraryData.dailySchedule);

      // MoodPalette 데이터 매칭
      const DESTINATIONS = [
        { id: "jeju", emoji: "🏝️", label: "제주도" },
        { id: "busan", emoji: "🌊", label: "부산" },
        { id: "gangneung", emoji: "⛰️", label: "강릉" },
        { id: "seoul", emoji: "🏙️", label: "서울" },
        { id: "japan", emoji: "🗾", label: "일본" },
        { id: "thailand", emoji: "🌴", label: "태국" },
        { id: "bali", emoji: "🏖️", label: "발리" },
        { id: "vietnam", emoji: "🍜", label: "베트남" },
      ];

      const MOODS = [
        { id: "burnout", emoji: "😫", label: "번아웃" },
        { id: "energy", emoji: "🌟", label: "활력 충전" },
        { id: "healing", emoji: "🧘", label: "힐링" },
        { id: "adventure", emoji: "🎒", label: "모험" },
      ];

      const STYLES = [
        { id: "nature", emoji: "🏞️", label: "자연" },
        { id: "city", emoji: "🏙️", label: "도심" },
        { id: "food", emoji: "🍜", label: "맛집탐방" },
        { id: "culture", emoji: "🎨", label: "문화체험" },
        { id: "relax", emoji: "🛀", label: "휴식" },
        { id: "activity", emoji: "🏄", label: "액티비티" },
      ];

      // 목적지 이모지 결정
      let destinationData;

      if (itineraryData.destinationEmoji) {
        destinationData = {
          id: "custom",
          emoji: itineraryData.destinationEmoji,
          label: itineraryData.destination,
        };
      } else {
        const destLower = itineraryData.destination.toLowerCase();
        const matchedDest = DESTINATIONS.find(d =>
          d.label.toLowerCase().includes(destLower) ||
          destLower.includes(d.label.toLowerCase())
        );

        destinationData = matchedDest || {
          id: "custom",
          emoji: "🌍",
          label: itineraryData.destination,
        };
      }

      const schedule = {
        title: itineraryData.title || `${itineraryData.destination} 여행`,
        description: `AI 추천 여행 일정 (${itineraryData.people || 1}명)`,
        startDate: itineraryData.startDate,
        endDate: itineraryData.endDate,
        people: itineraryData.people || 1,
        scheduleText,
        moodData: {
          mood: mood ? MOODS.find(m => m.emoji === mood) || { emoji: "🌟", label: "AI 추천" } : { emoji: "🌟", label: "AI 추천" },
          destination: destinationData,
          style: themes?.length > 0 ? STYLES.find(s => s.label === themes[0]) || { emoji: "✨", label: themes.join(", ") } : { emoji: "✨", label: "AI 여행" },
        },
      };

      console.log("[ChatBot] 일정 저장 중:", schedule);
      await addSchedule(schedule);
      
      toast.success("✅ 일정 저장 완료!", { duration: 3000 });
      setOpen(false); // 챗봇 닫기
      navigate("/planlab"); // 저장 후 이동
    } catch (err) {
      console.error("[ChatBot] 일정 저장 실패:", err);
      toast.error("일정 저장에 실패했습니다.");
      throw err;
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen((v) => !v)}
        style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#ffffff', 
            color: '#2563eb',
            border: '2px solid #2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'none',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            fontSize: '26px',
            outline: 'none'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#2563eb';
        }}
      >
        {open ? <FiX /> : <FiMessageSquare />}
      </button>

      {open && (
        <div className="chatWindow">
          <div className="chatHeader">
            <img src="/title.jpg" alt="Walk2Fly" style={{ height: '36px', objectFit: 'contain' }} />
            <button className="chatClose" onClick={() => setOpen(false)}>닫기</button>
          </div>

          <div className="chatBody">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.text}
                {m.role === "bot" && m.itineraryData && (
                  <button
                    className="save-itinerary-btn"
                    onClick={() => saveToSchedules(m.itineraryData)}
                  >
                    📅 일정으로 저장하기
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="loading-message">
                <span className="loading-spinner"></span>
                <span className="loading-text">여행 계획 고민중...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chatInputRow">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="계획을 마음껏 말씀해주세요."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button onClick={send} disabled={loading}>전송</button>
            <button onClick={resetChat} disabled={loading}>초기화</button>
          </div>
        </div>
      )}
      
      <LoginPromptModal 
        isOpen={isPromptOpen} 
        onClose={() => setIsPromptOpen(false)} 
      />
    </>
  );
}