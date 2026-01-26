import { useMemo, useState } from "react";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { clearPlans, loadPlans, removePlan, updatePlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import "../styles/plans.css";
import { simpleDiff } from "../services/diff";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function Plans() {
  const queryClient = useQueryClient();

  // ✅ React Query로 플랜 데이터 가져오기
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: loadPlans,
  });

  // ✅ 편집용 상태
  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);
  
  const total = plans.length;

  const openEdit = (plan) => {
    setSelected(plan);
    setNights(plan.nights ?? 1);
    setPeople(plan.people ?? 2);
    setPlanText(plan.planText ?? "");
  };

  const closeEdit = () => setSelected(null);

  // Mutation for Update
  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success("플랜이 수정 저장됐어요!");
      closeEdit();
    },
    onError: (err) => {
      toast.error("저장 실패: " + err.message);
    }
  });

  // Mutation for Delete
  const deleteMutation = useMutation({
    mutationFn: removePlan,
    onSuccess: () => {
      queryClient.invalidateQueries(["plans"]);
      toast.success("삭제되었습니다.");
    },
    onError: (err) => {
      toast.error("삭제 실패: " + err.message);
    }
  });

  const handleUpdateSave = async () => {
    if (!selected) return;

    const updated = {
      ...selected,
      nights,
      people,
      planText,
      updatedAt: new Date().toISOString(),
    };

    updateMutation.mutate(updated);
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
      <h2 className="pageTitle">내 플랜 보기</h2>
      <p className="pageDesc">저장한 여행 플랜을 확인/편집/삭제할 수 있어요. (총 {total}개)</p>

      <div className="plansActions">
        <button
          className="dangerBtn"
          onClick={async () => {
            if (!confirm("정말 전체 삭제할까요? (로컬만 지원)")) return;
            await clearPlans();
            queryClient.invalidateQueries(["plans"]);
          }}
        >
          전체 삭제 (Local Only)
        </button>

        <button className="ghostBtn2" onClick={() => queryClient.invalidateQueries(["plans"])}>
          새로고침
        </button>
      </div>

      {isLoading ? (
        <div className="emptyBox">로딩 중...</div>
      ) : plans.length === 0 ? (
        <div className="emptyBox">아직 저장된 플랜이 없어요. 여행지를 선택해서 저장해보세요!</div>
      ) : (
        <div className="plansGrid">
          {plans.map((p) => (
            <article
              key={p.id}
              className={`planCard ${p.type === 'course' ? 'coursePlan' : ''}`}
              style={{ cursor: "pointer", gridColumn: p.type === 'course' ? '1 / -1' : 'auto' }}
              onClick={() => openEdit(p)}
            >
              {p.type === 'course' && p.items?.length > 0 ? (
                  /* ✅ Course View Layout */
                  <div className="courseBody" onClick={(e) => e.stopPropagation()}>
                      <div className="planTopRow">
                          <div>
                              <div className="planTitle">📦 {p.title}</div>
                              <div className="planSub" style={{ color: '#ffd700' }}>{p.subtitle}</div>
                          </div>
                          <div className="planBtns">
                              <button className="dangerBtn" onClick={(e) => { e.stopPropagation(); if(confirm("코스 전체 삭제?")) deleteMutation.mutate(p.id); }}>삭제</button>
                          </div>
                      </div>
                      
                      {/* Timeline View */}
                      <div className="courseTimeline" style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                          {p.items.map((item, idx) => (
                              <div key={idx} style={{ minWidth: '160px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                                      <img src={item.firstimage || item.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f"} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>{idx + 1}. {item.title}</div>
                                  {idx < p.items.length - 1 && <div style={{ position: 'absolute', right: '-16px', top: '40%', fontSize: '1.2rem', color: '#666' }}>→</div>}
                              </div>
                          ))}
                      </div>
                      
                      <div className="planSmall" style={{ marginTop: '8px' }}>
                          {p.createdAt ? `저장일: ${formatDate(p.createdAt)}` : ""}
                      </div>
                  </div>
              ) : (
                  /* ✅ Single Item View (Existing) */
                  <>
                      <div className="planThumb">
                        {p.heroImage && <img src={p.heroImage} alt={p.title} />}
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

                        <div className="planSmall">
                          {p.createdAt ? `저장일: ${formatDate(p.createdAt)}` : ""}
                        </div>

                        {p.planText?.trim() && <pre className="planText">{p.planText}</pre>}

                        <div className="planBtns">
                          <button
                            className="dangerBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm("삭제할까요?")) deleteMutation.mutate(p.id);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                  </>
              )}
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
        onSave={handleUpdateSave}
      />
    </div>
  );
}