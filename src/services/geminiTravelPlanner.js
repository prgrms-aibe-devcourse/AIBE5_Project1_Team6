import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_ID = "gemini-3-flash-preview"; // 작동 확인됨 (Free tier)

// Gemini API 클라이언트 초기화
let genAI = null;
if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        console.log("[GeminiTravelPlanner] Gemini API 클라이언트 초기화 완료");
    } catch (err) {
        console.error("[GeminiTravelPlanner] Gemini 클라이언트 생성 실패:", err);
    }
} else {
    console.warn("[GeminiTravelPlanner] VITE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
}

/**
 * Gemini API를 호출하여 여행 일정 생성
 * @param {Object} selections - 사용자 선택 정보
 * @param {string} planType - 플랜 타입 (relaxed, balanced, active)
 * @returns {Promise<Array>} 생성된 일정 배열
 */
async function generateTravelItinerary(selections, planType) {
    if (!GEMINI_API_KEY || !genAI) {
        console.warn("[GeminiTravelPlanner] API 키가 없어 일정 생성 불가");
        return null;
    }

    const { mood, destination, style, startDate, endDate, people } = selections;

    // 날짜 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const days = nights + 1;

    // 플랜 타입별 설명
    const planDescriptions = {
        relaxed: "천천히 여유롭게 즐기는 일정. 서두르지 않고 각 장소에서 충분한 시간을 보냅니다.",
        balanced: "적당한 활동과 휴식의 균형을 맞춘 일정. 가장 추천하는 코스입니다.",
        active: "많은 것을 경험하고 싶은 분들을 위한 풍성한 일정. 에너지가 넘치는 여행!"
    };

    const prompt = `당신은 한국 여행 전문 플래너입니다. 아래 조건에 맞춰 ${days}일간의 상세 여행 일정을 생성해주세요.

**여행 조건:**
- 목적지: ${destination?.label || "제주도"}
- 기간: ${nights}박 ${days}일 (${startDate} ~ ${endDate})
- 인원: ${people}명
- 여행 무드: ${mood?.label || "힐링"}
- 여행 스타일: ${style?.label || "자연"}
- 플랜 컨셉: ${planDescriptions[planType]}

**요구사항:**
1. 각 날짜별로 ${planType === 'relaxed' ? '3-4개' : planType === 'balanced' ? '4개' : '4-5개'}의 일정을 추천해주세요.
2. 각 일정은 시간, 장소명, 활동, emoji를 포함해야 합니다.
3. 시간은 HH:MM 형식 (예: 09:00, 14:30)
4. 실제 존재하는 ${destination?.label || "제주도"}의 명소와 장소를 추천해주세요.
5. ${mood?.label} 무드와 ${style?.label} 스타일에 맞는 장소를 선택해주세요.
6. 각 활동에 어울리는 emoji를 1개씩 추가해주세요.

**응답 형식 (JSON):**
반드시 아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요.

\`\`\`json
{
  "dailyItinerary": [
    {
      "day": 1,
      "spots": [
        {
          "time": "09:00",
          "emoji": "🌅",
          "spot": "성산일출봉",
          "activity": "일출 감상"
        }
      ]
    }
  ]
}
\`\`\``;

    console.log(`[GeminiTravelPlanner] ${planType} 플랜 생성 시작 (${nights}박 ${days}일)`);

    // 재시도 로직 (최대 3회)
    let retries = 3;
    while (retries > 0) {
        try {
            const result = await genAI.models.generateContent({
                model: MODEL_ID,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            });

            console.log("[GeminiTravelPlanner] Gemini 응답 수신:", result);

            // 응답 텍스트 추출
            let responseText = null;
            if (result.candidates?.length > 0) {
                responseText = result.candidates[0]?.content?.parts?.[0]?.text;
            } else if (typeof result.response?.text === "function") {
                responseText = result.response.text();
            } else {
                responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
            }

            if (!responseText) {
                throw new Error("Gemini 응답에서 텍스트를 추출할 수 없습니다.");
            }

            console.log("[GeminiTravelPlanner] 응답 텍스트:", responseText);

            // JSON 파싱
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                responseText.match(/\{[\s\S]*"dailyItinerary"[\s\S]*\}/);

            if (jsonMatch) {
                const jsonText = jsonMatch[1] || jsonMatch[0];
                const parsed = JSON.parse(jsonText);

                if (parsed.dailyItinerary && Array.isArray(parsed.dailyItinerary)) {
                    console.log(`[GeminiTravelPlanner] ${planType} 플랜 생성 성공 (${parsed.dailyItinerary.length}일)`);
                    return parsed.dailyItinerary;
                }
            }

            throw new Error("유효한 JSON 형식의 응답을 받지 못했습니다.");

        } catch (err) {
            retries--;
            console.error(`[GeminiTravelPlanner] 일정 생성 실패 (남은 재시도: ${retries}):`, err.message);

            if ((err.message?.includes("503") || err.message?.includes("429")) && retries > 0) {
                const waitTime = Math.pow(2, 3 - retries) * 1000;
                console.log(`[GeminiTravelPlanner] ${waitTime}ms 대기 후 재시도...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            if (retries === 0) {
                console.error("[GeminiTravelPlanner] 최종 실패:", err.message);
                return null;
            }
        }
    }

    return null;
}

/**
 * 3가지 플랜 타입(여유/균형/알찬) 모두 생성
 * @param {Object} selections - 사용자 선택 정보
 * @returns {Promise<Object>} 3가지 플랜 데이터
 */
export async function generateAllTravelPlans(selections) {
    if (!GEMINI_API_KEY || !genAI) {
        console.warn("[GeminiTravelPlanner] API 키가 없습니다. Mock 데이터를 사용하세요.");
        return null;
    }

    try {
        console.log("[GeminiTravelPlanner] 3가지 플랜 생성 시작...");

        // 3가지 플랜을 병렬로 생성
        const [relaxedPlan, balancedPlan, activePlan] = await Promise.all([
            generateTravelItinerary(selections, 'relaxed'),
            generateTravelItinerary(selections, 'balanced'),
            generateTravelItinerary(selections, 'active')
        ]);

        if (!relaxedPlan || !balancedPlan || !activePlan) {
            console.error("[GeminiTravelPlanner] 일부 플랜 생성 실패");
            return null;
        }

        const { mood, destination, style, startDate, endDate } = selections;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const days = nights + 1;

        console.log("[GeminiTravelPlanner] 모든 플랜 생성 완료!");

        return {
            relaxed: {
                id: 1,
                type: 'relaxed',
                title: `${destination?.label || "제주도"} 여유 ${mood?.label || "힐링"} 여행`,
                subtitle: `느긋하게 쉬면서 즐기는 ${style?.label || "자연"} 테마`,
                description: "천천히 여유롭게 즐기는 일정입니다. 서두르지 않고 각 장소에서 충분한 시간을 보내세요.",
                badge: "🌿 여유",
                color: "rgba(102, 187, 106, 0.3)",
                dailyItinerary: relaxedPlan,
                moodEmoji: mood?.emoji || "🧘",
                destinationEmoji: destination?.emoji || "🏝️",
                styleEmoji: style?.emoji || "🏞️",
                nights,
                days,
            },
            balanced: {
                id: 2,
                type: 'balanced',
                title: `${destination?.label || "제주도"} ${mood?.label || "힐링"} 여행`,
                subtitle: `균형잡힌 ${style?.label || "자연"} 중심의 여행`,
                description: "적당한 활동과 휴식의 균형을 맞춘 일정입니다. 가장 추천하는 코스예요!",
                badge: "⭐ 추천",
                color: "rgba(79, 195, 247, 0.3)",
                dailyItinerary: balancedPlan,
                moodEmoji: mood?.emoji || "🧘",
                destinationEmoji: destination?.emoji || "🏝️",
                styleEmoji: style?.emoji || "🏞️",
                nights,
                days,
            },
            active: {
                id: 3,
                type: 'active',
                title: `${destination?.label || "제주도"} 알찬 ${mood?.label || "힐링"} 여행`,
                subtitle: `다채로운 ${style?.label || "자연"} 체험 일정`,
                description: "많은 것을 경험하고 싶은 분들을 위한 풍성한 일정입니다. 에너지가 넘치는 여행!",
                badge: "⚡ 알찬",
                color: "rgba(255, 152, 0, 0.3)",
                dailyItinerary: activePlan,
                moodEmoji: mood?.emoji || "🧘",
                destinationEmoji: destination?.emoji || "🏝️",
                styleEmoji: style?.emoji || "🏞️",
                nights,
                days,
            }
        };

    } catch (err) {
        console.error("[GeminiTravelPlanner] 전체 플랜 생성 중 오류:", err);
        return null;
    }
}
