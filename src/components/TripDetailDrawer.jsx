import { estimateItemCost } from "../services/recommend/estimateBudget";
import { getSensoryTags } from "../services/recommend/sensoryTags"; // Added
import TripMap from "./TripMap";
import { useTourDetail } from "../hooks/queries/useTourQueries";
import { useTripStore } from "../stores/tripStore";
import "../styles/drawer.css";
import { useMemo } from "react";

/**
 * TripDetailDrawer - Travel Guide Edition
 * Transforms simple detail view into a "Smart Travel Planner"
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
  const { budgetAmount } = useTripStore();
  
  // ✅ Detail API Fetching
  const contentId = item?.contentid;
  const contentTypeId = item?.contenttypeid;
  const { data: detailData, isLoading: isDetailLoading } = useTourDetail(contentId, contentTypeId);
  const displayItem = { ...item, ...detailData }; // Merge basic + detail

  // ✅ Item Specific Cost Calculation
  const itemCost = useMemo(() => {
    // This calculates cost for THIS item based on context
    // Hotel -> Cost * Nights
    // Food/Ticket -> Cost * People
    // Park/Free -> 0
    return estimateItemCost(item, people, nights);
  }, [nights, people, item]);

  // UI Display Logic
  const isFree = itemCost === 0;

  if (!open || !item) return null;

  const handleSave = () => {
    const payload = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      destinationId: item.id,
      title: item.title,
      subtitle: item.subtitle,
      heroImage: item.firstimage || item.image,
      nights,
      people,
      planText,
      stays: item.stays ?? [],
      foods: item.foods ?? [],
      lat: parseFloat(item.mapy || item.lat),
      lon: parseFloat(item.mapx || item.lon),
    };
    onSave?.(payload);
  };

  return (
    <div className="drawerOverlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        
        {/* 1. Hero Section */}
        <div className="drawerHero" style={{ height: '200px', position: 'relative' }}>
          <img 
            src={item.firstimage || item.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"} 
            alt={item.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '20px' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: 0 }}>{item.title}</h2>
            <p style={{ color: '#ddd', margin: '4px 0 0 0' }}>{item.addr1 || item.subtitle}</p>
          </div>
          <button className="drawerClose" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="drawerContent" style={{ padding: '24px', overflowY: 'auto', height: 'calc(100% - 280px)' }}>
            
            {/* 2. Travel Point (Why here?) */}
            <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#ffd700', marginBottom: '12px' }}>✨ 여행 포인트</h3>
                <p style={{ lineHeight: 1.6, color: '#eee' }}>
                   이곳은 <b>{item.title}</b>입니다. 
                   {detailData?.overview ? (
                       <span style={{ marginLeft: '4px' }}>
                           {detailData.overview.replace(/<[^>]+>/g, '').slice(0, 100)}...
                       </span>
                   ) : (
                       " 자연과 도심이 어우러진 멋진 명소로, 지친 일상에서 벗어나 새로운 영감을 얻기에 완벽한 장소입니다."
                   )}
                </p>
            </section>

            {/* ✅ 1. Sensory Review (Wellness) */}
            <section style={{ marginBottom: '32px', background: '#2a2a2a', padding: '16px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#fff' }}>🧘 웰니스 감각 지수 (Sensory)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    {[
                        { title: '소음', ...getSensoryTags(item).noise },
                        { title: '조도', ...getSensoryTags(item).light },
                        { title: '인파', ...getSensoryTags(item).crowd },
                    ].map((tag, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '4px' }}>{tag.title}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: tag.color }}>{tag.label}</div>
                            {/* Simple Bar */}
                            <div style={{ width: '40px', height: '4px', background: '#444', margin: '6px auto', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${(tag.level || 2) * 33}%`, height: '100%', background: tag.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Budget Check (Item Specific) */}
            <section style={{ marginBottom: '32px', background: '#222', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>💰 비용 확인 ({people}명 기준)</h3>
                    {isFree ? <span style={{ color: '#4caf50', fontWeight: 'bold' }}>무료</span> : <span style={{ color: '#ffd700', fontWeight: 'bold' }}>유료</span>}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', padding: '12px 0', borderTop: '1px solid #444', borderBottom: '1px solid #444' }}>
                    <span>예상 소요 비용</span>
                    <span>{itemCost.toLocaleString()}원</span>
                </div>
                 
                {budgetAmount && (
                    <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.85rem', color: '#aaa' }}>
                        내 전체 예산 ({budgetAmount.toLocaleString()}원)의 약 <b>{Math.round((itemCost / budgetAmount) * 100)}%</b>를 사용합니다.
                    </div>
                )}
                
                {/* Steppers Removed as per request */}
            </section>
            
            {/* 4. Smart Itinerary (AI Plan) */}
            <section style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>🗺️ 여행 계획표</h3>
                <button 
                        onClick={() => onImprove(detailData)}
                        style={{ background: 'linear-gradient(45deg, #6a11cb, #2575fc)', border: 'none', padding: '6px 12px', borderRadius: '20px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                        ⚡ AI 자동 제안
                    </button>
                </div>
                
                <textarea
                    className="planArea"
                    value={planText}
                    onChange={(e) => setPlanText(e.target.value)}
                    placeholder="AI 버튼을 누르면 추천 코스가 자동으로 작성됩니다."
                    style={{ height: '150px', background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
                />
            </section>
            
            {/* 5. Map */}
             {(item.mapy || item.lat) && (item.mapx || item.lon) && (
                <section style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                   <TripMap lat={parseFloat(item.mapy || item.lat)} lon={parseFloat(item.mapx || item.lon)} title={item.title} />
                </section>
             )}

             {/* ✅ 1. Navigation Links (New) */}
             <section style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <a 
                    href={`https://map.kakao.com/link/to/${item.title},${item.mapy || item.lat},${item.mapx || item.lon}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ flex: 1, padding: '10px', background: '#FAE100', color: '#3b1e1e', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                    🏎️ 카카오내비
                </a>
                <a 
                    href={`https://map.naver.com/v5/search/${item.title}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ flex: 1, padding: '10px', background: '#03C75A', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                    🗺️ 네이버지도
                </a>
             </section>

             {/* ✅ 1.5 Detail Info (Static AI Analysis Mockup) */}
             {detailData && (
                 <section style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
                     <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#aaa' }}>ℹ️ 이용 정보</h4>
                     <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.9rem', color: '#ddd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {detailData.restdate && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#888' }}>📅 휴무일</span>
                                 <span>{detailData.restdate}</span>
                             </li>
                         )}
                         {detailData.usetime && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#888' }}>⏰ 시간</span>
                                 {/* Remove HTML tags if any */}
                                 <span>{detailData.usetime.replace(/<[^>]+>/g, '')}</span>
                             </li>
                         )}
                         {detailData.parking && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#888' }}>🚗 주차</span>
                                 <span>{detailData.parking.replace(/<[^>]+>/g, '')}</span>
                             </li>
                         )}
                         {detailData.infocenter && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#888' }}>📞 문의</span>
                                 <span>{detailData.infocenter}</span>
                             </li>
                         )}
                         {/* Fallback if nothing */}
                         {!detailData.restdate && !detailData.usetime && !detailData.parking && (
                             <li style={{ color: '#666', fontStyle: 'italic' }}>상세 이용 정보가 없습니다.</li>
                         )}
                     </ul>
                 </section>
             )}

        </div>

        {/* 6. Footer Action */}
        <div className="drawerFooter" style={{ padding: '20px', borderTop: '1px solid #333', background: '#000' }}>
            <button 
                className="primaryBtn" 
                onClick={handleSave}
                style={{ width: '100%', height: '50px', fontSize: '1.1rem', background: '#fff', color: '#000', fontWeight: 'bold' }}
            >
                이 플랜으로 결정하기
            </button>
        </div>

      </aside>
    </div>
  );
}