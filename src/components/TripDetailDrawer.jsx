import TripMap from "./TripMap";
import { useTourDetail } from "../hooks/queries/useTourQueries";
import "../styles/drawer.css";

function Stepper({ label, value, setValue, min = 0, max = 30 }) {
  return (
    <div className="stepper">
      <div className="stepperLabel">{label}</div>
      <div className="stepperCtrls">
        <button onClick={() => setValue((v) => Math.max(min, v - 1))}>-</button>
        <div className="stepperValue">{value}</div>
        <button onClick={() => setValue((v) => Math.min(max, v + 1))}>+</button>
      </div>
    </div>
  );
}

function MiniCard({ image, title, sub }) {
  return (
    <div className="miniCard">
      <div className="miniThumb">
        <img src={image} alt={title} />
      </div>
      <div className="miniBody">
        <div className="miniTitle">{title}</div>
        {sub && <div className="miniSub">{sub}</div>}
      </div>
    </div>
  );
}

/**
 * extraTop: 드로어 상단(숙소 추천 위)에 끼워 넣는 영역 (Airplane 날씨)
 */
export default function TripDetailDrawer({
  open,
  onClose,
  item,
  nights,
  setNights,
  people,
  setPeople,
  planText,
  setPlanText,
  extraTop,
  onSave,
  onImprove,
  improveLabel = "AI 자동 보완",
  diffResult,
}) {
  // ✅ Detail API Fetching (only if contentid exists)
  const contentId = item?.contentid;
  const { data: detailData, isLoading: isDetailLoading } = useTourDetail(contentId);

  // Merge basic item with detail data if available
  // detailData has overview, homepage, tel, etc.
  const displayItem = { ...item, ...detailData };

  if (!open || !item) return null;

    const handleSave = () => {
    const payload = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),

      // 어디서 저장했는지 구분용 (Traffic/Walk/Airplane 데이터에 category 넣어도 되고)
      destinationId: item.id,
      title: item.title,
      subtitle: item.subtitle,
      heroImage: item.image,

      nights,
      people,
      planText,

      stays: item.stays ?? [],
      foods: item.foods ?? [],

      // Airplane일 때만 있을 수도 있음
      rateText: item.rateText,
      safety: item.safety,
      lat: item.lat,
      lon: item.lon,
    };

    onSave?.(payload);
  };

  return (
    <div className="drawerOverlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawerHeader">
          <div>
            <div className="drawerTitle">{item.title}</div>
            <div className="drawerSub">{item.subtitle}</div>
          </div>
          <button className="drawerClose" onClick={onClose}>닫기</button>
        </div>

        <div className="drawerHero">
          <img src={item.image} alt={item.title} />
        </div>

        {/* ✅ Google Map 연동 */}
        {item.lat && item.lon && (
          <TripMap lat={item.lat} lon={item.lon} title={item.title} />
        )}

        {/* ✅ Airplane에서만 위에 날씨/가이드 섹션 주입 */}
        {extraTop}

        {/* ✅ 상세 개요 (API Data) */}
        {contentId && (
            <section className="drawerSection">
                <h3>📖 상세 정보</h3>
                {isDetailLoading ? (
                    <div className="skeleton-text">상세 정보를 불러오는 중...</div>
                ) : (
                    <div style={{ lineHeight: 1.6, color: "#e0e0e0", fontSize: "0.95rem" }}>
                        {displayItem.overview ? (
                             // HTML entities removing could be needed but TourAPI usually gives clean text or basic HTML
                             displayItem.overview.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, '')
                        ) : (
                            "상세 정보가 없습니다."
                        )}
                        {displayItem.homepage && (
                            <div style={{ marginTop: 8, fontSize: "0.9rem" }}>
                                🌐 <span dangerouslySetInnerHTML={{ __html: displayItem.homepage }} />
                            </div>
                        )}
                    </div>
                )}
            </section>
        )}

        <section className="drawerSection">
          <h3>이런 숙소를 추천해요!</h3>
          <div className="miniGrid">
            {(item.stays ?? []).map((s) => (
              <MiniCard key={s.title} image={s.image} title={s.title} sub={s.sub} />
            ))}
          </div>
        </section>

        <section className="drawerSection">
          <h3>이런 음식은 어떠세요?</h3>
          <div className="miniGrid">
            {(item.foods ?? []).map((f) => (
              <MiniCard key={f.title} image={f.image} title={f.title} sub={f.sub} />
            ))}
          </div>
        </section>

        <section className="drawerSection">
          <h3>여행 조건</h3>
          <div className="controlsRow">
            <Stepper label="숙박(몇 박)" value={nights} setValue={setNights} min={0} max={14} />
            <Stepper label="인원(명)" value={people} setValue={setPeople} min={1} max={20} />
          </div>
        </section>

        <section className="drawerSection">
          <h3>세부 계획 템플릿</h3>
          <textarea
            className="planArea"
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
            placeholder={`예)\n- 1일차: 도착 → 체크인 → 야경\n- 2일차: 맛집 투어 → 관광\n- 준비물/예산:\n`}
          />
        </section>

        {diffResult && (diffResult.added.length || diffResult.removed.length) && (
  <section className="drawerSection">
    <h3>AI 변경점 미리보기</h3>

    {diffResult.added.length > 0 && (
      <>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>➕ 추가된 내용</div>
        <ul>
          {diffResult.added.map((l, i) => (
            <li key={i} style={{ color: "#7CFF9E" }}>{l}</li>
          ))}
        </ul>
      </>
    )}

    {diffResult.removed.length > 0 && (
      <>
        <div style={{ fontWeight: 900, marginTop: 10 }}>➖ 제거된 내용</div>
        <ul>
          {diffResult.removed.map((l, i) => (
            <li key={i} style={{ color: "#FF8C8C" }}>{l}</li>
          ))}
        </ul>
      </>
    )}
  </section>
)}

<div className="drawerFooter">
          <button
            className="ghostBtn"
            onClick={() => onImprove?.()}
            title="계획 템플릿/체크리스트/팁을 자동으로 채워줘요"
          >
            {improveLabel}
          </button>

          <button className="primaryBtn" onClick={handleSave}>
            저장
          </button>

          <button className="ghostBtn" onClick={onClose}>
            닫기
          </button>
        </div>
      </aside>
    </div>
  );
}