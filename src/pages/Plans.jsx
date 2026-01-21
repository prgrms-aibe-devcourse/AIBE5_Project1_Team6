import { useMemo, useState } from "react";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { clearPlans, loadPlans, removePlan, updatePlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import "../styles/plans.css";
import { simpleDiff } from "../services/diff";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function Plans() {
  // ✅ useEffect 없이 초기 로드
  const [plans, setPlans] = useState(() => loadPlans());

  // ✅ 편집용 상태
  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
const [diffResult, setDiffResult] = useState(null);
  const total = useMemo(() => plans.length, [plans]);

  const openEdit = (plan) => {
    setSelected(plan);
    setNights(plan.nights ?? 1);
    setPeople(plan.people ?? 2);
    setPlanText(plan.planText ?? "");
  };

  const closeEdit = () => setSelected(null);

  const handleUpdateSave = () => {
    if (!selected) return;

    const updated = {
      ...selected,
      nights,
      people,
      planText,
      updatedAt: new Date().toISOString(),
    };

    const next = updatePlan(updated);
    setPlans(next);
    alert("플랜이 수정 저장됐어요!");
    closeEdit();
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

  const openDetail = (item) => {
  setSelected(item);
  setNights(1);
  setPeople(2);
  setPlanText("");
  setDiffResult(null); // ✅ 추가(중요)
};

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">내 플랜 보기</h2>
      <p className="pageDesc">저장한 여행 플랜을 확인/편집/삭제할 수 있어요. (총 {total}개)</p>

      <div className="plansActions">
        <button
          className="dangerBtn"
          onClick={() => {
            if (!confirm("정말 전체 삭제할까요?")) return;
            clearPlans();
            setPlans([]);
          }}
        >
          전체 삭제
        </button>

        <button className="ghostBtn2" onClick={() => setPlans(loadPlans())}>
          새로고침
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="emptyBox">아직 저장된 플랜이 없어요. 여행지를 선택해서 저장해보세요!</div>
      ) : (
        <div className="plansGrid">
          {plans.map((p) => (
            <article
              key={p.id}
              className="planCard"
              style={{ cursor: "pointer" }}
              onClick={() => openEdit(p)}   // ✅ 클릭하면 편집 드로어 오픈
            >
              <div className="planThumb">
                <img src={p.heroImage} alt={p.title} />
              </div>

              <div className="planBody" onClick={(e) => e.stopPropagation()}>
                <div className="planTopRow">
                  <div>
                    <div className="planTitle">{p.title}</div>
                    <div className="planSub">{p.subtitle}</div>
                  </div>
                  <div className="planMeta">
                    <div>{p.nights}박</div>
                    <div>{p.people}명</div>
                  </div>
                </div>

                {p.rateText && <div className="planSmall">환율: {p.rateText}</div>}
                {p.safety && <div className="planSmall">안전: {String(p.safety).toUpperCase()}</div>}

                <div className="planSmall">저장일: {formatDate(p.createdAt)}</div>

                {p.planText?.trim() && <pre className="planText">{p.planText}</pre>}

                <div className="planBtns">
                  <button
                    className="dangerBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlans(removePlan(p.id));
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ✅ My Plans 편집 드로어 */}
      <TripDetailDrawer
        open={!!selected}
        onClose={closeEdit}
        item={selected}
        nights={nights}
        setNights={setNights}
        people={people}
        setPeople={setPeople}
        planText={planText}
        setPlanText={setPlanText}
        extraTop={null}

diffResult={diffResult}
        onImprove={handleImprove}
        improveLabel="AI 자동 보완(템플릿+팁)"
        onSave={handleUpdateSave}   // ✅ update로 저장
      />
    </div>
  );
}