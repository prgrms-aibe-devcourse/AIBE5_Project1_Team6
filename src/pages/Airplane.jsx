import { useEffect, useMemo, useState } from "react";
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

  // ✅ 선택한 지역 바뀌면 날씨 가져오기
  useEffect(() => {
    let alive = true;
    async function run() {
      if (!selected?.lat || !selected?.lon) return;

      setWeather({ loading: true, temp: null, wind: null, error: null });
      try {
        const w = await fetchCurrentWeatherByLatLon(selected.lat, selected.lon);
        if (!alive) return;
        setWeather({
          loading: false,
          temp: w.temp ?? null,
          wind: w.wind ?? null,
          error: null,
        });
      } catch {
        if (!alive) return;
        setWeather({
          loading: false,
          temp: null,
          wind: null,
          error: "날씨 정보를 불러오지 못했어요.",
        });
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [selected?.id]);

  // ✅ AI 자동 보완(텍스트 + diff)
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

  // ✅ 드로어 상단에 꽂을 날씨 블록
  const weatherBlock = useMemo(() => {
    if (!selected) return null;

    const tempLine = weather.loading
      ? "날씨 불러오는 중..."
      : weather.error
      ? weather.error
      : weather.temp != null
      ? `현재 기온: ${Math.round(weather.temp)}°C${
          weather.wind != null ? ` (바람 ${Math.round(weather.wind)} m/s)` : ""
        }`
      : "날씨 정보 없음";

    const tipLine =
      weather.loading
        ? "옷 추천을 준비 중이에요."
        : weather.temp != null
        ? clothingTip(weather.temp)
        : "여행 날짜를 알려주면 더 정확히 추천할게요.";

    return (
      <section className="drawerSection" style={{ marginTop: 8 }}>
        <h3>현지 날씨 & 옷 추천</h3>

        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 1000, marginBottom: 6 }}>{tempLine}</div>
          <div style={{ opacity: 0.9, lineHeight: 1.35 }}>{tipLine}</div>

          {selected.rateText && (
            <div style={{ marginTop: 10, opacity: 0.85, fontWeight: 900 }}>
              환율: {selected.rateText}
            </div>
          )}
        </div>
      </section>
    );
  }, [selected, weather]);

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
        extraTop={weatherBlock}     // ✅ 날씨가 실제로 보이게 연결
        onImprove={handleImprove}   // ✅ AI 버튼 동작
        diffResult={diffResult}     // ✅ diff 표시
        onSave={(payload) => {
          addPlan(payload);
          alert("플랜이 저장됐어요! (My Plans에서 확인 가능)");
        }}
      />
    </div>
  );
}