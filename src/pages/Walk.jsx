import { useEffect, useMemo, useRef, useState } from "react";
import { useKakaoMap } from "../hooks/useKakaoMap";
import { useLocationBasedTour } from "../hooks/queries/useTourQueries";
import { useGeolocation } from "../hooks/useGeolocation";
import { useTripStore } from "../stores/tripStore";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import "../styles/cards.css";
import "./Walk.css";
import { addPlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";
import { rankTourItems } from "../services/recommend/rankTourItems";
import { sequenceRoute } from "../services/recommend/sequenceRoute";
import { estimateBudgetLevel, estimateItemCost } from "../services/recommend/estimateBudget";
import { haversineKm } from "../utils/geo"; // Added import

import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";

export default function Walk() {
  // ✅ Map (SRP)
  const { mapRef, map, kakao } = useKakaoMap();
  const { user } = useAuthStore();
  const guestId = localStorage.getItem(GUEST_KEY);

  // ✅ Smart Recommendation Engine Logic
  const { themes = [], priority = '', budget = null, duration = null, mood, destination, budgetAmount } = useTripStore();
  const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();

  // Calculate greeting
  const greeting = useMemo(() => {
    let prefix = "";
    if (mood === 'burnout') prefix = "지친 당신을 위한 힐링 코스, ";
    else if (mood === 'refresh') prefix = "새로운 영감을 주는 코스, ";
    else if (mood === 'active') prefix = "에너지를 충전하는 코스, ";
    else if (mood === 'calm') prefix = "마음이 차분해지는 코스, ";

    if (user) return `${prefix}${user.email.split('@')[0]}님께 추천해드립니다.`;
    if (guestId) return `${prefix}비회원${guestId.slice(0, 4)}님께 추천해드립니다.`;
    return `${prefix}내 주변 맞춤 산책 코스를 추천해드립니다.`;
  }, [user, guestId, mood]);

  // Map Themes to ContentType
  const contentTypeId = useMemo(() => {
     if (!themes || !Array.isArray(themes)) return 12;
     if (themes.includes('food')) return 39;
     if (themes.includes('activity')) return 28;
     return 12; // Default Healing/Spot
  }, [themes]);

  // Radius & Sorting based on Priority
  const searchOptions = useMemo(() => {
     const isEnergySaving = priority === 'stamina';
     const radiusByDuration = 3000; // Force 3km for Walk intent
     return {
        radius: isEnergySaving ? Math.min(2000, radiusByDuration) : radiusByDuration,
        arrange: isEnergySaving ? 'E' : 'Q', 
     };
  }, [priority, duration]);

  // ✅ Fallback Location & Destination Logic
  const cityCoords = {
    seoul: { lat: 37.5665, lng: 126.9780 },
    busan: { lat: 35.1796, lng: 129.0756 },
    jeju: { lat: 33.4996, lng: 126.5312 },
  };
  const defaultLocation = { lat: 37.5665, lng: 126.9780 }; 

  const activeLocation = useMemo(() => {
    if (destination && cityCoords[destination]) return cityCoords[destination];
    if (destination === 'current' && location) return location;
    return location || defaultLocation;
  }, [destination, location]);

  const [customCenter, setCustomCenter] = useState(null);
  const searchCenter = customCenter || activeLocation;

  // Query API
  const { data: tourItems = [], isLoading: apiLoading } = useLocationBasedTour({
    mapX: searchCenter.lng, 
    mapY: searchCenter.lat,
    contentTypeId,
    radius: searchOptions.radius,
    arrange: searchOptions.arrange,
  });

  const isLoading = geoLoading || apiLoading;

  const rankedItems = useMemo(() => {
    // 1. Rank items
    const ranked = rankTourItems(tourItems, { priority, budget, duration, themes });
    
    // 2. Sequence logic
    const sequenced = sequenceRoute(ranked, themes);

    // 3. Create Courses
    const MAX_PER_COURSE = 4;
    const rawCourses = [
        sequenced.slice(0, MAX_PER_COURSE),
        sequenced.slice(MAX_PER_COURSE, MAX_PER_COURSE * 2),
        sequenced.slice(MAX_PER_COURSE * 2, MAX_PER_COURSE * 3)
    ].filter(course => course.length > 0);

    // 4. Budget Filtering - Relaxed
    // Return all generated courses to ensure variety (3 courses)
    // Budget compliance will be checked visually/contextually in the Drawer.
    
    return rawCourses;
  }, [tourItems, priority, budget, duration, themes, budgetAmount]);

  // Update map center
  useEffect(() => {
    if (!map || !kakao?.maps) return;
    if (customCenter) return; 

    const target = activeLocation;
    map.setCenter(new kakao.maps.LatLng(target.lat, target.lng));
    map.setLevel(location || destination ? 5 : 7);
  }, [map, kakao, activeLocation, customCenter, location, destination]);

  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  // ✅ Initialize Markers
  useEffect(() => {
    if (!map || !kakao) return;
    const markers = [];
    const polylines = [];
    const COURSE_STYLES = [
        { color: '#DC3232', badge: 'red' }, 
        { color: '#1E64F0', badge: 'blue' }, 
        { color: '#14A050', badge: 'green' } 
    ];

    if (rankedItems.length > 0) {
      rankedItems.forEach((courseItems, courseIdx) => {
          if(!courseItems || courseItems.length === 0) return;
          const style = COURSE_STYLES[courseIdx % 3] || COURSE_STYLES[0];

          courseItems.forEach((item, index) => {
            if (!item.mapy || !item.mapx) return;
            const position = new kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx));
            const content = document.createElement('div');
            content.className = `custom-overlay-marker`;
            content.innerHTML = `<span class="marker-number">${index + 1}</span>`;
            content.style.cssText = `
                width: 28px; height: 28px;
                background-color: ${style.color}; color: white; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; font-size: 14px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                cursor: pointer; border: 2px solid white;
            `;
            const overlay = new kakao.maps.CustomOverlay({ position, content, yAnchor: 1.1 });
            overlay.setMap(map);
            markers.push(overlay);
            content.onclick = () => openDetail(item);
          });

          const linePath = courseItems.filter(it => it.mapy && it.mapx).map(it => new kakao.maps.LatLng(parseFloat(it.mapy), parseFloat(it.mapx)));
          if (linePath.length > 1) {
            const polyline = new kakao.maps.Polyline({
                path: linePath, strokeWeight: 5, strokeColor: style.color, strokeOpacity: 0.8, strokeStyle: 'shortdash'
            });
            polyline.setMap(map);
            polylines.push(polyline);
          }
      });
      if (rankedItems[0]?.[0]) {
          const first = rankedItems[0][0];
          map.setCenter(new kakao.maps.LatLng(parseFloat(first.mapy), parseFloat(first.mapx)));
      }
    }
    return () => {
      markers.forEach((m) => m.setMap(null));
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, kakao, rankedItems]);

  const handleSearch = () => {
    if (!map || !keyword || !kakao) return;
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const place = data[0];
            const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
            map.setCenter(moveLatLon);
            map.setLevel(4);
            setCustomCenter({ lat: parseFloat(place.y), lng: parseFloat(place.x) });
            toast.success("검색 지역을 중심으로 새로운 코스를 생성합니다!");
        } else {
            toast.error("장소를 찾을 수 없습니다.");
        }
    });
  };

  const handleKeyDown = (e) => { if(e.key === 'Enter') handleSearch(); };

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    if (map && kakao && item.mapy && item.mapx) {
        map.panTo(new kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx)));
    }
  };

  const handleImprove = (detail) => {
    if (!selected) return;
    const improved = improvePlanText({ 
        title: selected.title, 
        nights, 
        people, 
        planText, 
        stays: selected.stays ?? [], 
        foods: selected.foods ?? [],
        theme: themes[0] || 'default',
        category: 'walk',
        detail
    });
    setDiffResult(simpleDiff(planText, improved)); setPlanText(improved);
  };

  const onSave = async (payload) => {
    try {
      await addPlan({ ...payload, category: "walk" });
      toast.success("플랜이 저장됐어요!");
      setSelected(null);
    } catch (e) { toast.error(e.message); }
  };

  const getCourseCost = (items) => {
      let total = 0;
      items.forEach(item => {
          total += estimateItemCost(item, people, nights);
      });
      return total;
  };

  const handleSaveCourse = async (courseItems, courseTitle) => {
      if (!courseItems || courseItems.length === 0) return;
      
      const totalCost = getCourseCost(courseItems);
      const payload = {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          createdAt: new Date().toISOString(),
          type: 'course', 
          title: `${courseTitle} (${mood || '산책'})`,
          subtitle: `총 ${courseItems.length}개 스팟 | 예상비용 ${totalCost.toLocaleString()}원`,
          heroImage: courseItems[0].firstimage || courseItems[0].image,
          nights,
          people,
          items: courseItems, 
          totalCost,
          planText: courseItems.map((it, i) => `${i+1}. ${it.title} (${estimateBudgetLevel(it).label})`).join('\n')
      };

      try {
          await addPlan({ ...payload, category: "walk" });
          toast.success(`'${courseTitle}'가 전체 저장되었습니다! 📂`);
      } catch (e) {
          console.error(e);
          toast.error("저장 중 오류가 발생했습니다.");
      }
  };

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Walk · 동네 산책 지도</h2>
      <div className="pageDesc" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
         {geoLoading ? <span>📡 GPS 수신 중... (기본: 서울)</span> : 
          geoError ? (
            <>
               <span>⚠️ 위치 권한 필요 (현재: 서울 기준).</span>
               <button onClick={requestLocation} style={{ padding: '4px 8px', borderRadius: '4px', background: '#444', color: '#fff' }}>
                  권한 요청
               </button>
            </>
          ) : greeting}
      </div>

      {budgetAmount && (
          <div style={{ textAlign: 'center', marginBottom: '16px', color: '#ccc', fontSize: '0.9rem' }}>
              💰 설정 예산: <b>{budgetAmount.toLocaleString()}원</b> 이내 ({people}인/코스 기준)
          </div>
      )}

      <div className="searchContainer">
         <input type="text" placeholder="지역이나 장소를 검색하세요" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} className="searchInput" />
         <button onClick={handleSearch} className="searchBtn">검색</button>
      </div>

      <div id="map" ref={mapRef} className="mapContainer"></div>

      <div className="coursesContainer" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {(rankedItems && Array.isArray(rankedItems) && rankedItems.length > 0) ? rankedItems.map((courseItems, courseIdx) => {
            const courseColor = ['#DC3232', '#1E64F0', '#14A050'][courseIdx % 3];
            const badgeColor = ['red', 'blue', 'green'][courseIdx % 3];
            const courseTitle = [`1️⃣ 추천 코스`, `2️⃣ 대안 코스`, `3️⃣ 숨은 명소`][courseIdx];
            const estimatedCost = getCourseCost(courseItems);
            
            // 🔥 Health Stats Calculation (Real Distance)
            const calculateCourseStats = (items) => {
                let totalDist = 0;
                for(let i=0; i<items.length-1; i++) {
                    const from = { lat: parseFloat(items[i].mapy), lng: parseFloat(items[i].mapx) };
                    const to = { lat: parseFloat(items[i+1].mapy), lng: parseFloat(items[i+1].mapx) };
                    totalDist += haversineKm(from, to);
                }
                // Add return to start or extra wandering buffer (x1.5)
                const walkDist = totalDist * 1.5; 
                return {
                    dist: walkDist.toFixed(1),
                    steps: Math.floor(walkDist * 1400),
                    kcal: Math.floor(walkDist * 65)
                };
            };
            
            const stats = calculateCourseStats(courseItems);

            return (
                <div key={`course-${courseIdx}`} className="courseSection">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderLeft: `4px solid ${courseColor}`, paddingLeft: '12px' }}>
                        <div>
                            <h4 style={{ fontSize: '1.2rem', color: courseColor, margin: 0 }}>
                                {courseTitle} <span style={{fontSize: '0.9rem', color: '#ccc', fontWeight: 'normal'}}>({people}인 기준 약 {estimatedCost.toLocaleString()}원)</span>
                            </h4>
                            {/* Health Badge */}
                            <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#aaa', display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#ff6b6b' }}>🔥 약 {stats.kcal}kcal 소모</span>
                                <span>|</span>
                                <span style={{ color: '#4caf50' }}>👣 {stats.steps.toLocaleString()}보 걷기 ({stats.dist}km)</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSaveCourse(courseItems, courseTitle)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${courseColor}`,
                                background: 'transparent',
                                color: courseColor,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = courseColor; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = courseColor; }}
                        >
                            📂 이 코스 전체 저장
                        </button>
                    </div>
                    <div className="grid">
                        {courseItems.map((it, index) => {
                            const bLevel = estimateBudgetLevel(it);
                            const itemCost = estimateItemCost(it, people, nights);
                            return (
                                <div key={it.contentid} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                                    <DestinationCard 
                                        title={it.title} 
                                        subtitle={it.addr1} 
                                        image={it.firstimage || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"} 
                                        rateText={"⭐ 4.5"} 
                                        badgeLeftTop={`${index + 1}`} 
                                        badgeColor={badgeColor} 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }) : (
            !isLoading && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                    <p>조건에 맞는 코스를 찾지 못했어요 😢</p>
                    {budgetAmount && <p>예산을 조금 더 늘려보시겠어요?</p>}
                </div>
            )
        )}
      </div>

      <TripDetailDrawer open={!!selected} onClose={() => setSelected(null)} item={selected} nights={nights} setNights={setNights} people={people} setPeople={setPeople} planText={planText} setPlanText={setPlanText} onImprove={handleImprove} onSave={onSave} improveLabel="AI 자동 보완" diffResult={diffResult} />
    </div>
  );
}