import { useMemo, useState } from "react";
import { useWeather } from "../hooks/useWeather";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { airplaneDestinations } from "../data/airplaneDestinations";
import { addPlan } from "../services/plansStorage";
import { fetchCurrentWeatherByLatLon, clothingTip } from "../services/weather";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";
import "../styles/cards.css";

const badgeOf = (safety) => {
  if (safety === "safe") return { badgeLeftTop: "SAFE", badgeColor: "green" };
  if (safety === "risk") return { badgeLeftTop: "RISK", badgeColor: "red" };
  return { badgeLeftTop: "CHECK", badgeColor: "gray" };
};

export default function Airplane() {
  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(3);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  const [weather, setWeather] = useState({
    loading: false,
    temp: null,
    wind: null,
    error: null,
  });

  const openDetail = (item) => {
    setSelected(item);
    setNights(3);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    setWeather({ loading: false, temp: null, wind: null, error: null });
  };

  // ✅ TanStack Query로 날씨 데이터 관리 (Server State)
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather(selected?.lat, selected?.lon);

  // ✅ AI 자동 보완
  const handleImprove = () => {
    if (!selected) return;

    const improved = improvePlanText({
      title: selected.title,
      nights,
      people,
      planText,
      stays: selected.stays ?? [],
      foods: selected.foods ?? [],
    });

    setDiffResult(simpleDiff(planText, improved));
    setPlanText(improved);
  };

  // ✅ Weather Display Component (Clean Logic)
  const WeatherSection = useMemo(() => {
    if (!selected) return null;

    const temp = weatherData?.temp;
    const wind = weatherData?.wind;

    let titleText = "날씨 정보 없음";
    let descText = "여행 날짜를 알려주면 더 정확히 추천할게요.";

    if (weatherLoading) {
        titleText = "현지 날씨 불러오는 중...";
        descText = "잠시만 기다려주세요.";
    } else if (weatherError) {
        titleText = "날씨 정보를 가져올 수 없습니다.";
        descText = "네트워크 상태를 확인해주세요.";
    } else if (temp != null) {
        titleText = `현재 기온: ${Math.round(temp)}°C ${wind ? `(바람 ${Math.round(wind)} m/s)` : ""}`;
        descText = clothingTip(temp);
    }

    return (
      <section className="drawerSection" style={{ marginTop: 8 }}>
        <h3>✈️ 현지 날씨 & 옷차림 Tip</h3>
        <div style={{
            padding: "16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(5px)"
        }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>
            {titleText}
          </div>
          <div style={{ fontSize: "0.95rem", opacity: 0.9, lineHeight: 1.5, color: "#e0e0e0" }}>
            {descText}
          </div>
          {selected.rateText && (
             <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.9rem", color: "#88ccff" }}>
               💱 환율 정보: {selected.rateText}
             </div>
          )}
        </div>
      </section>
    );
  }, [selected, weatherData, weatherLoading, weatherError]);

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Airplane · 해외 여행지 추천</h2>
      <p className="pageDesc">카드를 클릭하면 상세 플랜이 오른쪽에서 열려요.</p>

      <div className="grid">
        {airplaneDestinations.map((d) => (
          <div key={d.id} onClick={() => openDetail(d)} style={{ cursor: "pointer" }}>
            <DestinationCard
              image={d.image}
              title={d.title}
              subtitle="해외 인기 여행지"
              ratingText="★ 4.9"
              priceText="추천 일정 3~6일"
              bottomLeftTag={d.rateText}
              {...badgeOf(d.safety)}
            />
          </div>
        ))}
      </div>

      <TripDetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        item={selected}
        nights={nights}
        setNights={setNights}
        people={people}
        setPeople={setPeople}
        planText={planText}
        setPlanText={setPlanText}
        extraTop={WeatherSection}     // ✅ 날씨가 실제로 보이게 연결
        onImprove={handleImprove}   // ✅ AI 버튼 동작
        diffResult={diffResult}     // ✅ diff 표시
        onSave={async (payload) => {
          await addPlan(payload);
          toast.success("플랜이 저장됐어요! (My Plans에서 확인 가능)");
        }}
      />
    </div>
  );
}