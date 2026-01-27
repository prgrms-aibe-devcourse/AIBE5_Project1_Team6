import { useEffect, useMemo, useRef, useState } from "react";
import { useKakaoMap } from "../hooks/useKakaoMap";
import { useLocationBasedTour } from "../hooks/queries/useTourQueries";
import { useGeolocation } from "../hooks/useGeolocation";
import { useTripStore } from "../stores/tripStore";
import toast from "react-hot-toast";
import RecommendationCard from "../components/RecommendationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import WeatherWidget from "../components/WeatherWidget";
import "../styles/cards.css";
import "./Walk.css";
import { addPlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";
import { rankTourItems } from "../services/recommend/rankTourItems";
import { sequenceRoute } from "../services/recommend/sequenceRoute";
import { estimateBudgetLevel, estimateItemCost } from "../services/recommend/estimateBudget";
import { haversineKm } from "../utils/geo";
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

  // Calculate greeting (Memoized)
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

  // ✅ Category State (Defaults to Store Theme, but can be switched)
  const [activeCategory, setActiveCategory] = useState(() => {
    if (themes.includes('food')) return 'food';
    if (themes.includes('activity')) return 'activity';
    return 'healing';
  });

  // Map Themes to ContentType
  const contentTypeId = useMemo(() => {
    if (activeCategory === 'food') return 39;
    if (activeCategory === 'activity') return 28;
    return 12; // Default Healing/Spot
  }, [activeCategory]);

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
    // 1. Rank items (Override theme with activeCategory)
    const currentThemes = [activeCategory];
    const ranked = rankTourItems(tourItems, { priority, budget, duration, themes: currentThemes });

    // 2. Sequence logic
    const sequenced = sequenceRoute(ranked, currentThemes);

    // 3. Create Courses
    const MAX_PER_COURSE = 4;
    const rawCourses = [
      sequenced.slice(0, MAX_PER_COURSE),
      sequenced.slice(MAX_PER_COURSE, MAX_PER_COURSE * 2),
      sequenced.slice(MAX_PER_COURSE * 2, MAX_PER_COURSE * 3)
    ].filter(course => course.length > 0);

    // 4. Budget Filtering - Relaxed
    return rawCourses;
  }, [tourItems, priority, budget, duration, activeCategory, budgetAmount]);

  // Update map center
  useEffect(() => {
    if (!map || !kakao?.maps) return;
    if (customCenter) return;

    const target = activeLocation;
    map.setCenter(new kakao.maps.LatLng(target.lat, target.lng));
    map.setLevel(location || destination ? 5 : 7);
  }, [map, kakao, activeLocation, customCenter, location, destination]);

  // ✅ State for Markers & Detail Drawer (Restored!)
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
        if (!courseItems || courseItems.length === 0) return;
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
      if (rankedItems?.[0]?.[0]) {
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

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

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
      heroImage: courseItems[0]?.firstimage || courseItems[0]?.image || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80",
      nights,
      people,
      items: courseItems,
      totalCost,
      // ✅ Wellness Data
      wellness: {
        noise: Math.floor(Math.random() * 40 + 30),
        light: Math.floor(Math.random() * 1000 + 100),
        crowd: ['여유', '보통', '약간 혼잡'][Math.floor(Math.random() * 3)]
      },
      planText: courseItems.map((it, i) => `${i + 1}. ${it.title} (${estimateBudgetLevel(it).label})`).join('\n')
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
      {/* Page Description */}
      <div className="pageDesc" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', minHeight: '24px' }}>
        {geoLoading && <span style={{ color: '#666' }}>📡 GPS 수신 중... (기본: 서울)</span>}
        {geoError && (
          <>
            <span style={{ color: '#d9534f' }}>⚠️ 위치 권한 필요 (현재: 서울 기준).</span>
            <button onClick={requestLocation} style={{ padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#fff' }}>
              권한 요청
            </button>
          </>
        )}
      </div>

      {/* ✅ Category Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        {['activity', 'food', 'healing'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '10px 24px',
              borderRadius: '50px',
              border: activeCategory === cat ? 'none' : '1px solid #e0e0e0',
              background: activeCategory === cat ? '#3b82f6' : '#fff', // Soft Blue
              color: activeCategory === cat ? '#ffffff' : '#555',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.95rem',
              boxShadow: activeCategory === cat ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {cat === 'activity' ? '🏃 액티비티' : cat === 'food' ? '🍽️ 맛집' : '🌿 힐링'}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div id="map" ref={mapRef} className="mapContainer"></div>
        {/* ✅ Weather Widget (Floating) */}
        <WeatherWidget lat={searchCenter.lat} lon={searchCenter.lng} absolute={true} />
      </div>

      <div className="searchContainer">
        <input type="text" placeholder="지역이나 장소를 검색하세요" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} className="searchInput" />
        <button onClick={handleSearch} className="searchBtn" style={{ background: '#3b82f6' }}>검색</button>
      </div>

      <div className="coursesContainer" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* Recommendation Header */}
        <div style={{ padding: '20px 0 0' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px', color: '#1a1a1a' }}>
            ✨ {user?.email ? user.email.split('@')[0] : (guestId ? `비회원${guestId.slice(0, 4)}` : '여행러')}님을 위한 추천
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>AI가 분석한 맞춤형 여행지예요!</p>
        </div>

        <div style={{ width: '100%', height: '1px', background: '#eee' }}></div>

        {(rankedItems && Array.isArray(rankedItems) && rankedItems.length > 0) ? rankedItems.map((courseItems, courseIdx) => {
          const courseColor = ['#DC3232', '#1E64F0', '#14A050'][courseIdx % 3];
          const sectionTitle = courseIdx === 0 ? "마음에 드는 곳이 있나요? 💚" : "이런 여행지는 어때요? 👀";
          const estimatedCost = getCourseCost(courseItems);

          return (
            <div key={`course-${courseIdx}`} className="courseSection">
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                  {sectionTitle}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#888' }}>
                  <span>총 {courseItems.length}개 스팟</span>
                  <span style={{ width: '1px', height: '12px', background: '#ddd' }}></span>
                  <span>약 {estimatedCost.toLocaleString()}원</span>
                </div>
              </div>

              <div className="grid">
                {courseItems.map((it, index) => {
                  const matchScore = 90 + Math.floor((Math.random() * 10) - (index * 2)); // 90-99%
                  return (
                    <div key={it.contentid} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                      <RecommendationCard
                        title={it.title}
                        country={it.addr1 ? it.addr1.split(" ")[0] : "대한민국"}
                        tag={activeCategory === 'activity' ? '액티비티' : activeCategory === 'food' ? '맛집' : '힐링'}
                        desc={it.addr1 || "AI가 추천하는 최고의 장소입니다."}
                        image={it.firstimage || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"}
                        matchScore={matchScore}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleSaveCourse(courseItems, `코스 ${courseIdx + 1}`)}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: `1px solid ${courseColor}`,
                  background: 'white',
                  color: courseColor,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = courseColor; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = courseColor; }}
              >
                📂 이 코스 전체 저장하기
              </button>
            </div>
          );
        }) : (
          !isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
              <p style={{ fontSize: '1.1rem' }}>조건에 맞는 코스를 찾지 못했어요 😢</p>
              {budgetAmount && <p style={{ marginTop: '8px' }}>예산이나 조건을 조금 변경해보세요!</p>}
            </div>
          )
        )}
      </div>

      <TripDetailDrawer open={!!selected} onClose={() => setSelected(null)} item={selected} nights={nights} setNights={setNights} people={people} setPeople={setPeople} planText={planText} setPlanText={setPlanText} onImprove={handleImprove} onSave={onSave} improveLabel="AI 자동 보완" diffResult={diffResult} />
    </div>
  );
}