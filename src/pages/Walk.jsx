import { useMemo, useState } from "react";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { walkRegions } from "../data/walkRegions";
import "../styles/cards.css";
import { addPlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";

const makePlaces = (city, district) => ([
  {
    id: `${city}-${district}-1`,
    image: "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=80",
    title: `${city} ${district} 산책 코스`,
    subtitle: "도보 추천 · 카페/공원/야경",
    ratingText: "★ 4.9",
    priceText: "예상 소요 2~3시간",
    stays: [
      {
        title: "도보 5분 감성숙소",
        sub: "체크인 편한 위치",
        image: "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "가성비 스테이",
        sub: "깔끔/실속형",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    foods: [
      {
        title: "동네 대표 분식",
        sub: "가볍게 한 끼",
        image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "인기 카페 라인",
        sub: "산책 후 디저트",
        image: "https://images.unsplash.com/photo-1520975958225-1adcbf58f2a7?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  {
    id: `${city}-${district}-2`,
    image: "https://images.unsplash.com/photo-1520975958225-1adcbf58f2a7?auto=format&fit=crop&w=1200&q=80",
    title: `${district} 맛집 라인`,
    subtitle: "도보 추천 · 로컬 맛집 밀집",
    ratingText: "★ 4.8",
    priceText: "예산 1~3만원",
    stays: [
      {
        title: "핫플 근처 호텔",
        sub: "야식/편의성 최고",
        image: "https://images.unsplash.com/photo-1551887373-6aa7a1b2a19d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "조용한 게스트하우스",
        sub: "혼행 추천",
        image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    foods: [
      {
        title: "지역 대표 국밥",
        sub: "든든하게!",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "저녁 야장",
        sub: "분위기 맛집",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
]);

export default function Walk() {
  const [city, setCity] = useState("Seoul");
  const [district, setDistrict] = useState(walkRegions["Seoul"][0]);
const [diffResult, setDiffResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");

  const districts = useMemo(() => walkRegions[city] || [], [city]);
  const items = useMemo(() => makePlaces(city, district), [city, district]);

const openDetail = (item) => {
  setSelected(item);
  setNights(1);
  setPeople(2);
  setPlanText("");
  setDiffResult(null); // ✅ 추가(중요)
};

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

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Walk · 우리 동네 도보 플랜</h2>
      <p className="pageDesc">거주 지역을 선택하면, 도보로 즐길 수 있는 장소를 추천해요.</p>

      <div className="filters">
        <select value={city} onChange={(e) => { setCity(e.target.value); setDistrict(walkRegions[e.target.value][0]); }}>
          {Object.keys(walkRegions).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid">
        {items.map((it) => (
          <div key={it.id} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
            <DestinationCard {...it} />
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
diffResult={diffResult}
  planText={planText}
  setPlanText={setPlanText}
  onImprove={() => {
    const improved = improvePlanText({
      title: selected.title,
      nights,
      people,
      planText,
      stays: selected.stays ?? [],
      foods: selected.foods ?? [],
    });
    setPlanText(improved);
  }}
  onSave={(payload) => {
    addPlan(payload);
    alert("플랜이 저장됐어요! (My Plans에서 확인 가능)");
  }}
/>
    </div>
  );
}