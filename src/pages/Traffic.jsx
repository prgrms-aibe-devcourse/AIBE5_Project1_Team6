import { useState } from "react";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { trafficDestinations } from "../data/trafficDestinations";
import { improvePlanText } from "../services/aiPlanner";
import { addPlan } from "../services/plansStorage";
import "../styles/cards.css";
import { simpleDiff } from "../services/diff";

export default function Traffic() {
  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
const [diffResult, setDiffResult] = useState(null);
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
      <h2 className="pageTitle">Traffic · 국내 여행지 추천</h2>
      <p className="pageDesc">카드를 클릭하면 오른쪽에서 상세 추천이 열려요.</p>

      <div className="grid">
        {trafficDestinations.map((it) => (
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
  planText={planText}
  setPlanText={setPlanText}
diffResult={diffResult}
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