import { estimateItemCost } from "../services/recommend/estimateBudget";
import { getSensoryTags } from "../services/recommend/sensoryTags"; 
import TripMap from "./TripMap";
import { useTourDetail } from "../hooks/queries/useTourQueries";
import { useTripStore } from "../stores/tripStore";
import "../styles/drawer.css";
import { useMemo } from "react";

import toast from "react-hot-toast"; // Ensure toast is imported if not already

export default function TripDetailDrawer({
  open,
  onClose,
  item,
  nights,
  people,
  planText,
  setPlanText,
  onSave,
  onUnregister, // New prop
  onImprove,
  onOpenAIOptions,

  showScheduleControls = false,
  showAIButton = false, // New prop to show AI Generate button instead of Register/Unregister
  isRegistered = false, // Renamed from isSaved
  hideRegisterButton = false // New prop to hide the registration button
}) {
  const { budgetAmount } = useTripStore();
  
  const contentId = item?.contentid;
  const contentTypeId = item?.contenttypeid;
  const { data: detailData } = useTourDetail(contentId, contentTypeId); // Removed name collision
  
  const itemCost = useMemo(() => {
    return estimateItemCost(item, people, nights);
  }, [nights, people, item]);

  const isFree = itemCost === 0;

  if (!open || !item) return null;

  const handleSave = () => {
    if (isRegistered) {
        toast.error("이미 등록된 장소입니다.");
        return;
    }

    const payload = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: new Date().toISOString(),
      destinationId: item.id,
      title: item.title,
      subtitle: item.addr1 || "주소 정보 없음",
      heroImage: item.firstimage || item.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f", 
      nights,
      people,
      planText,
      stays: item.stays ?? [],
      foods: item.foods ?? [],
      lat: parseFloat(item.mapy || item.lat),
      lon: parseFloat(item.mapx || item.lon),
      items: [item],
      totalCost: itemCost || 0,
      wellness: {
          noise: getSensoryTags(item).noise?.level ?? 5,
          light: getSensoryTags(item).light?.level ?? 5,
          crowd: getSensoryTags(item).crowd?.text ?? '보통'
      },
    };
    onSave?.(payload);
  };

  return (
    <div className="drawerOverlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        
        {/* 1. Hero Section */}
        <div className="drawerHero">
          <img 
            src={item.firstimage || item.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"} 
            alt={item.title} 
          />
          <div className="drawerHeader">
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', lineHeight: 1.2 }}>{item.title}</h2>
            <p style={{ fontSize: '0.95rem',opacity: 0.9, marginTop: '4px' }}>{item.addr1 || item.subtitle}</p>
          </div>
          <button className="drawerClose" onClick={onClose}>✕</button>
        </div>

        <div className="drawerContent">
            
            {/* 2. Travel Point - Dynamic & Varied */}
            <section className="drawerSection">
                <h3>✨ 여행 포인트</h3>
                <p style={{ lineHeight: 1.6, color: '#444', fontSize: '0.95rem' }}>
                   {(() => {
                       const cTypeId = Number(item.contenttypeid);
                       // Generate Varied Text based on Type/Category
                       let intro = "";
                       const name = item.title;

                       if (cTypeId === 39) { // Food
                           const phrases = [
                               `<b>${name}</b>, 이곳은 미식가들 사이에서 입소문 난 찐 맛집입니다! 😋`,
                               `<b>${name}</b>에서 잊지 못할 인생 맛집의 추억을 만들어보세요.`,
                               `정성스러운 맛과 분위기가 어우러진 <b>${name}</b>입니다.`
                           ];
                           intro = phrases[Math.floor(Math.random() * phrases.length)];
                       } else if (cTypeId === 28) { // Leports/Activity
                           const phrases = [
                               `<b>${name}</b>, 에너지가 넘치는 당신을 위한 최고의 액티비티 명소입니다! 🏃`,
                               `지루할 틈 없는 짜릿한 경험, <b>${name}</b>에서 시작해보세요.`,
                               `활기찬 분위기와 즐거움이 가득한 <b>${name}</b>입니다.`
                           ];
                           intro = phrases[Math.floor(Math.random() * phrases.length)];
                       } else if (cTypeId === 12 || cTypeId === 14) { // Tour/Culture
                           const phrases = [
                               `<b>${name}</b>, 자연과 도심이 조화롭게 어우러진 힐링 스팟입니다. 🌿`,
                               `마음의 여유를 찾고 싶다면 <b>${name}</b>만큼 좋은 곳이 없죠.`,
                               `새로운 영감을 얻고 싶으신가요? <b>${name}</b>을(를) 추천합니다.`
                           ];
                           intro = phrases[Math.floor(Math.random() * phrases.length)];
                       } else {
                           intro = `<b>${name}</b>, 특별한 시간을 보내기에 더할 나위 없는 장소입니다.`;
                       }

                       return (
                           <>
                               <span dangerouslySetInnerHTML={{ __html: intro }} />
                               {detailData?.overview ? (
                                   <>
                                       <br/><br/>
                                       <span style={{ color:'#666' }}>
                                           {detailData.overview.replace(/<[^>]+>/g, '').slice(0, 120)}...
                                       </span>
                                   </>
                               ) : (
                                   " 사랑하는 사람들과 함께 방문하여 소중한 추억을 남겨보세요."
                               )}
                           </>
                       );
                   })()}
                </p>
            </section>

            {/* ✅ 1. Sensory Review (Wellness) */}
            <section className="drawerSection" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                <h3>🧘 웰니스 감각 지수</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '16px' }}>
                    {[
                        { title: '소음', ...getSensoryTags(item).noise },
                        { title: '조도', ...getSensoryTags(item).light },
                        { title: '인파', ...getSensoryTags(item).crowd },
                    ].map((tag, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '6px' }}>{tag.title}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>{tag.label || tag.text}</div>
                            {/* Simple Bar */}
                            <div style={{ width: '40px', height: '4px', background: '#e0e0e0', margin: '8px auto', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${(tag.level || 2) * 33}%`, height: '100%', background: tag.color || '#5C94FF' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Budget Check */}
            <section className="drawerSection" style={{ background: '#fff', padding: '0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <h3>💰 비용 확인 <span style={{fontSize: '0.8em', fontWeight: 'normal', color: '#666', marginLeft: '6px'}}>({people}명 기준)</span></h3>
                    {isFree ? 
                        <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>무료</span> : 
                        <span style={{ background: '#FFF3E0', color: '#EF6C00', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>유료</span>
                    }
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111', fontSize: '1.2rem', fontWeight: '800', padding: '16px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                    <span>예상 소요 비용</span>
                    <span>{itemCost.toLocaleString()}원</span>
                </div>
                 
            </section>
            
            {/* 4. Smart Itinerary (Conditional) */}
            {showScheduleControls && (
                <section className="drawerSection">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3>🗺️ 여행 계획표</h3>
                        <button 
                            onClick={() => onImprove(detailData)}
                            style={{ background: '#eef2ff', border: 'none', padding: '6px 12px', borderRadius: '20px', color: '#5C94FF', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.target.style.background = '#e0e7ff'}
                            onMouseOut={(e) => e.target.style.background = '#eef2ff'}
                        >
                            ⚡ AI 자동 제안
                        </button>
                    </div>
                    
                    <textarea
                        className="planArea"
                        value={planText}
                        onChange={(e) => setPlanText(e.target.value)}
                        placeholder="AI 버튼을 누르면 추천 코스가 자동으로 작성됩니다."
                    />
                </section>
            )}
            
            {/* 5. Map */}
             {(item.mapy || item.lat) && (item.mapx || item.lon) && (
                <section style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px', border: '1px solid #eee' }}>
                   <TripMap lat={parseFloat(item.mapy || item.lat)} lon={parseFloat(item.mapx || item.lon)} title={item.title} />
                </section>
             )}

             {/* Navigation Links */}
             <section style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
                <a 
                    href={`https://map.kakao.com/link/to/${item.title},${item.mapy || item.lat},${item.mapx || item.lon}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ flex: 1, padding: '12px', background: '#FEE500', color: '#191919', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    카카오내비
                </a>
                <a 
                    href={`https://map.naver.com/v5/search/${item.title}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ flex: 1, padding: '12px', background: '#03C75A', color: '#fff', borderRadius: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                    네이버지도
                </a>
             </section>

             {/* Detail Info */}
             {detailData && (
                 <section style={{ marginBottom: '24px', background: '#fafafa', padding: '20px', borderRadius: '16px', border: '1px solid #eee' }}>
                     <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#888', fontWeight: '600' }}>ℹ️ 이용 정보</h4>
                     <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '0.9rem', color: '#444', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {detailData.restdate && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#999' }}>📅 휴무일</span>
                                 <span>{detailData.restdate}</span>
                             </li>
                         )}
                         {detailData.usetime && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#999' }}>⏰ 시간</span>
                                 <span>{detailData.usetime.replace(/<[^>]+>/g, '')}</span>
                             </li>
                         )}
                         {detailData.parking && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#999' }}>🚗 주차</span>
                                 <span>{detailData.parking.replace(/<[^>]+>/g, '')}</span>
                             </li>
                         )}
                         {detailData.infocenter && (
                             <li style={{ display: 'flex' }}>
                                 <span style={{ width: '80px', color: '#999' }}>📞 문의</span>
                                 <span>{detailData.infocenter}</span>
                             </li>
                         )}
                         {!detailData.restdate && !detailData.usetime && !detailData.parking && (
                             <li style={{ color: '#999', fontStyle: 'italic' }}>상세 이용 정보가 없습니다.</li>
                         )}
                     </ul>
                 </section>
             )}

        </div>

        <div className="drawerFooter">
            {showAIButton ? (
                <button 
                    className="generate-btn"
                    onClick={onOpenAIOptions}
                    style={{ 
                        width: '100%',
                        flex: 1, 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                        color: '#fff', 
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        padding: '16px',
                        cursor: 'pointer',
                        borderRadius: '12px'
                    }}
                >
                    ✨ AI로 전체 일정 만들기
                </button>
            ) : (
                <>
                    {showScheduleControls && (
                        <button 
                            className="secondaryBtn"
                            onClick={onOpenAIOptions}
                            style={{ flex: 1, marginRight: '8px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                        >
                            ✨ AI로 전체 일정 만들기
                        </button>
                    )}
                    {!hideRegisterButton && !showAIButton && (
                        <button 
                            className="primaryBtn" 
                            onClick={isRegistered ? onUnregister : handleSave}
                            style={{ 
                                flex: 1,
                                background: isRegistered ? '#ffebee' : undefined,
                                color: isRegistered ? '#d32f2f' : undefined,
                                border: isRegistered ? '1px solid #ffcdd2' : undefined
                            }}
                        >
                            {isRegistered ? "여행지 해제하기" : "여행지 등록하기"}
                        </button>
                    )}
                </>
            )}
        </div>

      </aside>
    </div>
  );
}