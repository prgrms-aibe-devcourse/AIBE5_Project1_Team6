import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { generateAllTravelPlans } from "../services/geminiTravelPlanner";
import "../styles/instantroute.css";

// Calculate number of nights
const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
};

// Mock AI 응답 함수 - 전체 여행 기간에 대한 일정 생성
const generateDailySchedule = (dayNumber, selections, planType) => {
    const { destination, style } = selections;
    const destKey = destination?.id || "jeju";
    const styleKey = style?.id || "nature";

    // 날짜별 다양한 활동 템플릿
    const dailyTemplates = {
        jeju: {
            nature: {
                day1: {
                    relaxed: [
                        { time: "10:00", spot: "한라산 둘레길", activity: "여유로운 산책", emoji: "🌲" },
                        { time: "13:00", spot: "카페 쿠키비", activity: "브런치와 독서", emoji: "☕" },
                        { time: "16:00", spot: "숙소 테라스", activity: "낮잠과 휴식", emoji: "😴" },
                        { time: "19:00", spot: "조용한 해변", activity: "석양 감상", emoji: "🌅" },
                    ],
                    balanced: [
                        { time: "09:00", spot: "섭지코지", activity: "해돋이 명상", emoji: "🌅" },
                        { time: "12:00", spot: "성산일출봉 카페", activity: "브런치", emoji: "☕" },
                        { time: "15:00", spot: "우도", activity: "자전거 산책", emoji: "🚴" },
                        { time: "18:00", spot: "협재해수욕장", activity: "석양 감상", emoji: "🌅" },
                    ],
                    active: [
                        { time: "07:00", spot: "성산일출봉", activity: "등반과 일출", emoji: "⛰️" },
                        { time: "10:00", spot: "비자림", activity: "숲 트레킹", emoji: "🌲" },
                        { time: "13:00", spot: "만장굴", activity: "동굴 탐험", emoji: "🕳️" },
                        { time: "17:00", spot: "서핑 스팟", activity: "서핑 체험", emoji: "🏄" },
                    ],
                },
                day2: {
                    relaxed: [
                        { time: "10:30", spot: "애월 카페거리", activity: "브런치와 오션뷰", emoji: "☕" },
                        { time: "14:00", spot: "숲속 스파", activity: "힐링 마사지", emoji: "💆" },
                        { time: "17:00", spot: "곽지해변", activity: "산책", emoji: "🌊" },
                        { time: "19:30", spot: "숙소", activity: "별 관측", emoji: "✨" },
                    ],
                    balanced: [
                        { time: "09:30", spot: "한림공원", activity: "식물원 산책", emoji: "🌺" },
                        { time: "12:30", spot: "협재맛집", activity: "해산물 점심", emoji: "🦞" },
                        { time: "15:30", spot: "금능해변", activity: "해변 산책", emoji: "🌊" },
                        { time: "18:30", spot: "애월 카페", activity: "석양과 커피", emoji: "☕" },
                    ],
                    active: [
                        { time: "08:00", spot: "한라산 등반", activity: "백록담 코스", emoji: "⛰️" },
                        { time: "14:00", spot: "정상 휴게소", activity: "도시락", emoji: "🍱" },
                        { time: "17:00", spot: "하산", activity: "숲길 트레킹", emoji: "🌲" },
                        { time: "20:00", spot: "온천", activity: "피로 회복", emoji: "♨️" },
                    ],
                },
                day3: {
                    relaxed: [
                        { time: "11:00", spot: "카페 델문도", activity: "브런치", emoji: "☕" },
                        { time: "14:00", spot: "중문색달해변", activity: "해변 산책", emoji: "🌊" },
                        { time: "16:00", spot: "티하우스", activity: "차 명상", emoji: "🍵" },
                        { time: "18:00", spot: "공항 근처 카페", activity: "여행 정리", emoji: "✈️" },
                    ],
                    balanced: [
                        { time: "09:00", spot: "천지연폭포", activity: "아침 산책", emoji: "💧" },
                        { time: "11:30", spot: "서귀포 맛집", activity: "흑돼지", emoji: "🍖" },
                        { time: "14:00", spot: "올레시장", activity: "쇼핑과 간식", emoji: "🛍️" },
                        { time: "17:00", spot: "동문시장", activity: "저녁 식사", emoji: "🍜" },
                    ],
                    active: [
                        { time: "07:30", spot: "주상절리", activity: "일출 감상", emoji: "🌅" },
                        { time: "10:00", spot: "카약 투어", activity: "해양 스포츠", emoji: "🚣" },
                        { time: "13:00", spot: "파라솔 아래", activity: "점심", emoji: "🏖️" },
                        { time: "16:00", spot: "제트스키", activity: "수상 레저", emoji: "🏄" },
                    ],
                },
            },
            relax: {
                day1: {
                    relaxed: [
                        { time: "11:00", spot: "스파 앤 힐링", activity: "아로마 마사지", emoji: "💆" },
                        { time: "14:00", spot: "티 하우스", activity: "차 명상", emoji: "🍵" },
                        { time: "17:00", spot: "온천", activity: "족욕", emoji: "♨️" },
                        { time: "19:00", spot: "숙소", activity: "명상과 요가", emoji: "🧘" },
                    ],
                    balanced: [
                        { time: "10:00", spot: "한라산 둘레길", activity: "가벼운 산책", emoji: "🌲" },
                        { time: "13:00", spot: "카페 쿠키비", activity: "조용한 카페", emoji: "🍰" },
                        { time: "16:00", spot: "스파 앤 힐링", activity: "마사지", emoji: "💆" },
                        { time: "19:00", spot: "숙소 테라스", activity: "별 보기", emoji: "✨" },
                    ],
                    active: [
                        { time: "08:00", spot: "요가 클래스", activity: "비치 요가", emoji: "🧘" },
                        { time: "11:00", spot: "스파 리조트", activity: "전신 마사지", emoji: "💆" },
                        { time: "15:00", spot: "명상 센터", activity: "명상 워크샵", emoji: "🕉️" },
                        { time: "18:00", spot: "해변", activity: "음악 명상", emoji: "🎵" },
                    ],
                },
                day2: {
                    relaxed: [
                        { time: "10:00", spot: "온천 리조트", activity: "온천욕", emoji: "♨️" },
                        { time: "13:00", spot: "채식 레스토랑", activity: "건강식", emoji: "🥗" },
                        { time: "16:00", spot: "숲속 산책로", activity: "삼림욕", emoji: "🌲" },
                        { time: "19:00", spot: "숙소", activity: "독서와 휴식", emoji: "📚" },
                    ],
                    balanced: [
                        { time: "09:00", spot: "명상 센터", activity: "아침 명상", emoji: "🧘" },
                        { time: "12:00", spot: "비건 카페", activity: "건강한 브런치", emoji: "🥑" },
                        { time: "15:00", spot: "힐링 스파", activity: "스톤 테라피", emoji: "💆" },
                        { time: "18:00", spot: "해변", activity: "석양 명상", emoji: "🌅" },
                    ],
                    active: [
                        { time: "07:00", spot: "산책로", activity: "트레킹", emoji: "🥾" },
                        { time: "10:00", spot: "요가 스튜디오", activity: "파워 요가", emoji: "🧘" },
                        { time: "14:00", spot: "스파", activity: "딥 티슈 마사지", emoji: "💆" },
                        { time: "17:00", spot: "명상 공간", activity: "그룹 명상", emoji: "🕉️" },
                    ],
                },
            },
        },
        busan: {
            city: {
                day1: {
                    relaxed: [
                        { time: "10:00", spot: "송정해변", activity: "산책", emoji: "🌊" },
                        { time: "13:00", spot: "북카페", activity: "독서와 커피", emoji: "📚" },
                        { time: "16:00", spot: "영화의전당", activity: "영화 감상", emoji: "🎬" },
                        { time: "19:00", spot: "광안리", activity: "야경 감상", emoji: "🌉" },
                    ],
                    balanced: [
                        { time: "10:00", spot: "해운대 해수욕장", activity: "아침 산책", emoji: "🌊" },
                        { time: "12:30", spot: "광안리 맛집", activity: "해물 점심", emoji: "🦞" },
                        { time: "15:00", spot: "감천문화마을", activity: "예술 탐방", emoji: "🎨" },
                        { time: "18:00", spot: "광안대교", activity: "야경 감상", emoji: "🌉" },
                    ],
                    active: [
                        { time: "08:00", spot: "태종대", activity: "등산과 일출", emoji: "⛰️" },
                        { time: "11:00", spot: "용두산공원", activity: "탐방", emoji: "🗼" },
                        { time: "14:00", spot: "동백섬", activity: "트레킹", emoji: "🌲" },
                        { time: "17:00", spot: "해변", activity: "비치 스포츠", emoji: "🏐" },
                    ],
                },
                day2: {
                    relaxed: [
                        { time: "11:00", spot: "센텀시티 스파", activity: "찜질방", emoji: "♨️" },
                        { time: "14:00", spot: "루프탑 카페", activity: "여유", emoji: "☕" },
                        { time: "17:00", spot: "해운대", activity: "석양", emoji: "🌅" },
                        { time: "19:30", spot: "포차", activity: "저녁", emoji: "🍻" },
                    ],
                    balanced: [
                        { time: "09:00", spot: "오륙도", activity: "스카이워크", emoji: "🌊" },
                        { time: "12:00", spot: "자갈치시장", activity: "점심", emoji: "🐟" },
                        { time: "15:00", spot: "국제시장", activity: "쇼핑", emoji: "🛍️" },
                        { time: "18:00", spot: "남포동", activity: "저녁", emoji: "🍜" },
                    ],
                    active: [
                        { time: "07:00", spot: "해변", activity: "조깅", emoji: "🏃" },
                        { time: "10:00", spot: "서핑 스쿨", activity: "서핑 강습", emoji: "🏄" },
                        { time: "14:00", spot: "해변 카페", activity: "점심", emoji: "🍔" },
                        { time: "17:00", spot: "비치발리", activity: "스포츠", emoji: "🏐" },
                    ],
                },
            },
            food: {
                day1: {
                    relaxed: [
                        { time: "11:00", spot: "전통 찻집", activity: "차와 디저트", emoji: "🍵" },
                        { time: "14:00", spot: "씨앗호떡", activity: "간식", emoji: "🥞" },
                        { time: "17:00", spot: "루프탑 카페", activity: "차 한잔", emoji: "☕" },
                        { time: "19:30", spot: "해변 레스토랑", activity: "여유로운 저녁", emoji: "🍽️" },
                    ],
                    balanced: [
                        { time: "11:00", spot: "자갈치시장", activity: "신선한 회", emoji: "🐟" },
                        { time: "14:00", spot: "씨앗호떡", activity: "유명 간식", emoji: "🥞" },
                        { time: "17:00", spot: "해운대 포차", activity: "술과 안주", emoji: "🍻" },
                        { time: "20:00", spot: "광안리 카페", activity: "디저트", emoji: "🍰" },
                    ],
                    active: [
                        { time: "10:00", spot: "아침 죽집", activity: "전통 죽", emoji: "🥘" },
                        { time: "12:00", spot: "맛집 투어 1", activity: "돼지국밥", emoji: "🍜" },
                        { time: "15:00", spot: "맛집 투어 2", activity: "밀면", emoji: "🍝" },
                        { time: "18:00", spot: "맛집 투어 3", activity: "해물찜", emoji: "🦐" },
                    ],
                },
                day2: {
                    relaxed: [
                        { time: "10:30", spot: "브런치 카페", activity: "여유로운 아침", emoji: "🥐" },
                        { time: "14:00", spot: "디저트 맛집", activity: "케이크", emoji: "🍰" },
                        { time: "17:00", spot: "전통 주점", activity: "막걸리", emoji: "🍶" },
                        { time: "19:30", spot: "고깃집", activity: "고기 구이", emoji: "🥩" },
                    ],
                    balanced: [
                        { time: "10:00", spot: "국밥집", activity: "든든한 아침", emoji: "🍲" },
                        { time: "13:00", spot: "해물 전문점", activity: "점심", emoji: "🦞" },
                        { time: "16:00", spot: "카페 거리", activity: "디저트", emoji: "☕" },
                        { time: "19:00", spot: "포장마차", activity: "저녁", emoji: "🍢" },
                    ],
                    active: [
                        { time: "09:00", spot: "전통시장", activity: "아침 탐방", emoji: "🍜" },
                        { time: "11:30", spot: "맛집 1", activity: "점심", emoji: "🍱" },
                        { time: "14:30", spot: "맛집 2", activity: "간식", emoji: "🍡" },
                        { time: "17:30", spot: "맛집 3", activity: "저녁", emoji: "🍖" },
                    ],
                },
            },
        },
        seoul: {
            culture: {
                day1: {
                    relaxed: [
                        { time: "11:00", spot: "북촌 한옥마을", activity: "여유로운 산책", emoji: "🏘️" },
                        { time: "14:00", spot: "전통 찻집", activity: "차와 대화", emoji: "🍵" },
                        { time: "17:00", spot: "도서관", activity: "독서", emoji: "📚" },
                        { time: "19:00", spot: "한강", activity: "야경 감상", emoji: "🌉" },
                    ],
                    balanced: [
                        { time: "10:00", spot: "경복궁", activity: "궁궐 산책", emoji: "🏯" },
                        { time: "13:00", spot: "북촌 한옥마을", activity: "전통 체험", emoji: "🏘️" },
                        { time: "16:00", spot: "삼청동 카페거리", activity: "여유로운 차", emoji: "🍵" },
                        { time: "19:00", spot: "남산타워", activity: "야경", emoji: "🗼" },
                    ],
                    active: [
                        { time: "09:00", spot: "창덕궁", activity: "비원 투어", emoji: "🏯" },
                        { time: "12:00", spot: "인사동", activity: "전통 공예 체험", emoji: "🎨" },
                        { time: "15:00", spot: "국립박물관", activity: "문화 탐방", emoji: "🏛️" },
                        { time: "18:00", spot: "전통 공연", activity: "사물놀이", emoji: "🥁" },
                    ],
                },
                day2: {
                    relaxed: [
                        { time: "10:30", spot: "덕수궁", activity: "돌담길 산책", emoji: "🏯" },
                        { time: "13:30", spot: "서촌 카페", activity: "브런치", emoji: "☕" },
                        { time: "16:30", spot: "익선동", activity: "한옥 카페", emoji: "🏘️" },
                        { time: "19:00", spot: "청계천", activity: "야경 산책", emoji: "🌉" },
                    ],
                    balanced: [
                        { time: "09:30", spot: "종묘", activity: "역사 탐방", emoji: "🏛️" },
                        { time: "12:30", spot: "광장시장", activity: "전통 음식", emoji: "🍜" },
                        { time: "15:30", spot: "서울로7017", activity: "산책", emoji: "🌳" },
                        { time: "18:30", spot: "DDP", activity: "야경", emoji: "🏢" },
                    ],
                    active: [
                        { time: "08:30", spot: "북한산", activity: "등산", emoji: "⛰️" },
                        { time: "13:00", spot: "산 정상", activity: "도시락", emoji: "🍱" },
                        { time: "16:00", spot: "하산", activity: "휴식", emoji: "☕" },
                        { time: "19:00", spot: "먹자골목", activity: "저녁", emoji: "🍖" },
                    ],
                },
            },
        },
    };

    const destSpots = dailyTemplates[destKey]?.[styleKey] || dailyTemplates.jeju.nature;
    const dayKey = `day${dayNumber > 3 ? ((dayNumber - 1) % 3) + 1 : dayNumber}`;
    const daySpots = destSpots[dayKey] || destSpots.day1;

    return daySpots[planType] || daySpots.balanced;
};

// Mock AI 응답 함수 - 3개의 다른 플랜 생성 (전체 기간)
const generateMockRoutes = (selections) => {
    const { mood, destination, style, startDate, endDate, people } = selections;
    const nights = calculateNights(startDate, endDate);
    const days = nights + 1;

    const generateFullItinerary = (planType) => {
        const allDaysSpots = [];
        for (let day = 1; day <= days; day++) {
            const daySpots = generateDailySchedule(day, selections, planType);
            allDaysSpots.push({
                day,
                spots: daySpots,
            });
        }
        return allDaysSpots;
    };

    const planTypes = [
        {
            id: 1,
            type: "relaxed",
            title: `${destination?.label || "제주도"} 여유 ${mood?.label || "힐링"} 여행`,
            subtitle: `느긋하게 쉬면서 즐기는 ${style?.label || "자연"} 테마`,
            description: "천천히 여유롭게 즐기는 일정입니다. 서두르지 않고 각 장소에서 충분한 시간을 보내세요.",
            badge: "🌿 여유",
            color: "rgba(102, 187, 106, 0.3)",
        },
        {
            id: 2,
            type: "balanced",
            title: `${destination?.label || "제주도"} ${mood?.label || "힐링"} 여행`,
            subtitle: `균형잡힌 ${style?.label || "자연"} 중심의 ${people}인 여행`,
            description: "적당한 활동과 휴식의 균형을 맞춘 일정입니다. 가장 추천하는 코스예요!",
            badge: "⭐ 추천",
            color: "rgba(79, 195, 247, 0.3)",
        },
        {
            id: 3,
            type: "active",
            title: `${destination?.label || "제주도"} 알찬 ${mood?.label || "힐링"} 여행`,
            subtitle: `다채로운 ${style?.label || "자연"} 체험 일정`,
            description: "많은 것을 경험하고 싶은 분들을 위한 풍성한 일정입니다. 에너지가 넘치는 여행!",
            badge: "⚡ 알찬",
            color: "rgba(255, 152, 0, 0.3)",
        },
    ];

    return planTypes.map(plan => ({
        ...plan,
        dailyItinerary: generateFullItinerary(plan.type),
        moodEmoji: mood?.emoji || "🧘",
        destinationEmoji: destination?.emoji || "🏝️",
        styleEmoji: style?.emoji || "🏞️",
        nights,
        days,
    }));
};

export default function InstantRouteGenerator({ selections, onComplete, onCancel, preGeneratedPlans }) {
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [progress, setProgress] = useState(0);
    const [usingMockData, setUsingMockData] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const loadRoutes = async () => {
            // If plans are already generated (passed from parent), skip loading and API call
            if (preGeneratedPlans) {
                const generatedRoutes = [
                    preGeneratedPlans.relaxed,
                    preGeneratedPlans.balanced,
                    preGeneratedPlans.active
                ];
                setRoutes(generatedRoutes);
                setUsingMockData(false);
                setLoading(false);
                setProgress(100);
                return;
            }

            // 로딩 애니메이션 시작 (Fallback or standalone usage)
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) {
                        clearInterval(progressInterval);
                        return 95;
                    }
                    return prev + 5;
                });
            }, 100);

            try {
                console.log("[InstantRoute] AI 플랜 생성 시작...");

                // Gemini API로 일정 생성 시도
                const aiPlans = await generateAllTravelPlans(selections);

                if (isCancelled) return;

                if (aiPlans) {
                    // AI 플랜 성공
                    console.log("[InstantRoute] AI 플랜 생성 성공!");
                    const generatedRoutes = [
                        aiPlans.relaxed,
                        aiPlans.balanced,
                        aiPlans.active
                    ];
                    setRoutes(generatedRoutes);
                    setUsingMockData(false);
                    toast.success("✨ AI가 완벽한 여행 플랜을 생성했어요!");
                } else {
                    // AI 플랜 실패 -> Mock 데이터 사용
                    console.warn("[InstantRoute] AI 플랜 생성 실패. Mock 데이터 사용.");
                    const mockRoutes = generateMockRoutes(selections);
                    setRoutes(mockRoutes);
                    setUsingMockData(true);
                    toast("💡 샘플 플랜을 보여드려요. API 키를 설정하면 더 정확한 플랜을 받을 수 있어요!", {
                        icon: "ℹ️",
                        duration: 4000,
                    });
                }
            } catch (err) {
                console.error("[InstantRoute] 플랜 생성 중 오류:", err);

                if (isCancelled) return;

                // 오류 발생 시에도 Mock 데이터 사용
                const mockRoutes = generateMockRoutes(selections);
                setRoutes(mockRoutes);
                setUsingMockData(true);
                toast.error("일정 생성 중 문제가 발생했어요. 샘플 플랜을 보여드릴게요.");
            } finally {
                if (!isCancelled) {
                    clearInterval(progressInterval);
                    setProgress(100);
                    // 약간의 지연 후 로딩 완료
                    setTimeout(() => {
                        if (!isCancelled) {
                            setLoading(false);
                        }
                    }, 300);
                }
            }
        };

        loadRoutes();

        return () => {
            isCancelled = true;
        };
    }, [selections, preGeneratedPlans]);

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
        // Do NOT auto-confirm anymore (User request)
    };

    const handleConfirm = (routeToConfirm = selectedRoute) => {
        if (routeToConfirm) {
            // 전체 일정을 텍스트로 변환
            // 전체 일정을 JSON 텍스트로 변환 (구조 및 비용 정보 보존)
            const scheduleText = JSON.stringify(routeToConfirm.dailyItinerary);

            onComplete({
                ...selections,
                route: routeToConfirm,
                title: routeToConfirm.title,
                description: routeToConfirm.subtitle,
                scheduleText,
                dailyItinerary: routeToConfirm.dailyItinerary, // 구조화된 데이터도 저장
            });
        }
    };

    const nights = calculateNights(selections.startDate, selections.endDate);

    return (
        <div className="instantRouteOverlay" onClick={onCancel}>
            <div className="instantRouteModal multiOption" onClick={(e) => e.stopPropagation()}>
                {loading ? (
                    <div className="loadingState">
                        <div className="loadingSpinner">
                            <div className="spinner"></div>
                        </div>
                        <h2 className="loadingTitle">✨ AI가 {nights}박 {nights + 1}일 완벽한 여행 플랜을 준비 중...</h2>
                        <p className="loadingText">컵라면보다 빠르게!</p>
                        <div className="loadingProgress">
                            <div className="loadingBar" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="loadingHints">
                            <p>💡 {selections.mood?.label} 상태에 최적화된 {nights + 1}일 일정을 생성 중</p>
                            <p>📍 {selections.destination?.label}의 숨은 명소 찾는 중</p>
                            <p>🎯 {selections.style?.label} 테마에 맞춰 3가지 옵션 조정 중</p>
                        </div>
                    </div>
                ) : (
                    <div className="routeOptions fadeIn">
                        <div className="optionsHeader">
                            <button className="closeBtn" onClick={onCancel}>
                                ✕
                            </button>
                            <h2 className="optionsTitle">
                                {nights}박 {nights + 1}일, 당신을 위한 3가지 여행 플랜 🎯
                            </h2>
                            <p className="optionsSubtitle">
                                가장 마음에 드는 일정을 선택하면 <b>즉시 저장</b>됩니다
                            </p>
                        </div>

                        <div className="optionsGrid">
                            {routes.map((route) => (
                                <div
                                    key={route.id}
                                    className={`optionCard ${selectedRoute?.id === route.id ? "selected" : ""}`}
                                    onClick={() => handleSelectRoute(route)}
                                    style={{
                                        '--hover-color': route.color.replace('0.3', '0.8') // Make border color vivid on hover
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = route.color.replace('0.3', '0.8');
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = selectedRoute?.id === route.id ? '#5C94FF' : '#e0e0e0';
                                        e.currentTarget.style.transform = selectedRoute?.id === route.id ? 'translateY(-4px)' : 'translateY(0)';
                                    }}
                                >
                                    <div className="optionHeader" style={{ background: route.color }}>
                                        <div className="optionEmojis">
                                            {route.moodEmoji} {route.destinationEmoji} {route.styleEmoji}
                                        </div>
                                        <div className="optionBadge">{route.badge}</div>
                                    </div>

                                    <div className="optionBody">
                                        <h3 className="optionTitle">{route.title}</h3>
                                        <p className="optionSubtitle">{route.subtitle}</p>
                                        <p className="optionDescription">{route.description}</p>

                                        <div className="optionDays">
                                            {route.dailyItinerary.map((dayData, index) => (
                                                <div key={index} className="dayPreview">
                                                    <div className="dayTitle">Day {dayData.day}</div>
                                                    <div className="daySpots">
                                                        {dayData.spots.map((spot, spotIndex) => (
                                                            <span key={spotIndex} className="spotMini">
                                                                {spot.emoji} {spot.spot}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {selectedRoute?.id === route.id && (
                                            <div className="selectedIndicator">
                                                ✓ 선택됨
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="optionsFooter">
                            <button className="secondaryBtn" onClick={onCancel} style={{ flex: 1 }}>
                                다시 선택하기
                            </button>
                            <button 
                                className="primaryBtn" 
                                onClick={() => handleConfirm()}
                                disabled={!selectedRoute}
                                style={{ 
                                    flex: 1,
                                    background: selectedRoute ? '#3b82f6' : '#e2e8f0',
                                    cursor: selectedRoute ? 'pointer' : 'not-allowed'
                                }}
                            >
                                ✓ {selectedRoute ? "선택한 플랜으로 저장하기" : "플랜을 선택해주세요"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
