import { useEffect, useMemo, useState, useRef } from "react";
import { useKakaoMap } from "../hooks/useKakaoMap";
import { useLocationBasedTour } from "../hooks/queries/useTourQueries";
import { useGeolocation } from "../hooks/useGeolocation";
import { useTripStore } from "../stores/tripStore";
import toast from "react-hot-toast";
import RecommendationCard from "../components/RecommendationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import WeatherWidget from "../components/WeatherWidget"; 
import { improvePlanText } from "../services/aiPlanner";
import { addSchedule } from "../services/schedulesStorage";
import "../styles/cards.css";
import "./Walk.css"; 
import LoadingOverlay from "../components/LoadingOverlay";
import { simpleDiff } from "../services/diff";
import { haversineKm, KOREA_CITY_COORDS } from "../utils/geo";
import { rankTourItems } from "../services/recommend/rankTourItems";
import { sequenceRoute } from "../services/recommend/sequenceRoute";
import { estimateBudgetLevel, estimateItemCost } from "../services/recommend/estimateBudget";
import { useAuthStore } from "../stores/authStore";
import { createNotification } from "../services/mypageService";
import { savePlace, isPlaceSaved } from "../services/savedPlacesService";
import { useWeather } from "../hooks/useWeather";
import { GUEST_KEY } from "../utils/guestUtils";

export default function Traffic() {
  const { mapRef, map, kakao } = useKakaoMap();
  const { user } = useAuthStore();
  const guestId = localStorage.getItem(GUEST_KEY);

  const { themes = [], priority = '', budget = null, duration = null, trafficOption, budgetAmount, companion } = useTripStore();
  const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();

  const [customCenter, setCustomCenter] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null); 
  const [farDestination, setFarDestination] = useState(null);
  const [keyword, setKeyword] = useState("");

  const [hasInteracted, setHasInteracted] = useState(() => {
     // If session exists, user was here. restore state.
     const currentKey = `traffic_recommendation_${trafficOption}`; 
     return false; 
  });
  
  const [isDistHovered, setIsDistHovered] = useState(false); // ✅ Added for Distance Widget Hover Effect

  // ✅ Category State
  const [activeCategory, setActiveCategory] = useState(() => {
    if (themes.includes('food')) return 'food';
    if (themes.includes('activity')) return 'activity';
    return 'healing';
  });

  // STORAGE_KEY is now dynamic per function usage (traffic_recommendation_${mode}) 

  const recommendRandomCity = (currentLoc, targetOption) => {
    const mode = targetOption || trafficOption;
    console.log(`🎲 Generating New Recommendation for ${mode}...`);
    let candidates = [];
    let selected = null;

    if (mode === 'far') {
      candidates = Object.entries(KOREA_CITY_COORDS)
          .map(([name, coords]) => ({ name, ...coords, dist: haversineKm(currentLoc, coords) }))
          .filter(city => city.dist >= 100 && city.name !== '제주'); // 🚫 Exclude Jeju due to distance/ferry

      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        selected = candidates[randomIndex];
      } else {
        selected = { name: '부산', lat: 35.1796, lng: 129.0756 }; 
      }
      setFarDestination(selected);

    } else if (mode === 'near') {
      candidates = Object.entries(KOREA_CITY_COORDS)
          .map(([name, coords]) => ({ name, ...coords, dist: haversineKm(currentLoc, coords) }))
          .filter(city => city.dist > 5 && city.dist < 100);

      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        selected = candidates[randomIndex];
        // toast.success(\`오늘은 가볍게 '\${selected.name}' 근교로 떠나볼까요? 🚗\`, { icon: '🏙️' }); // Removed as requested
      } else {
         selected = { ...currentLoc, name: '현재 위치 주변' };
      }
    } else {
      selected = { ...currentLoc, name: '현재 위치 주변' };
    }

    console.log("✅ Selected:", selected);
    setActiveLocation(selected);
    sessionStorage.setItem(`traffic_recommendation_${mode}`, JSON.stringify(selected));
    setHasInteracted(true); // ✅ Interaction Triggered
  };

  useEffect(() => {
    if (!location) {
      if (!activeLocation && !geoLoading && geoError) {
        setActiveLocation({ lat: 37.5665, lng: 126.9780 });
      }
      return;
    }

    if (activeLocation) return;

    const currentKey = `traffic_recommendation_${trafficOption}`;
    const saved = sessionStorage.getItem(currentKey);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setActiveLocation(parsed);
            if (trafficOption === 'far') setFarDestination(parsed);
            setHasInteracted(true); // ✅ Session Restored -> Interaction assumed
            return;
        } catch (e) {
            sessionStorage.removeItem(currentKey);
        }
    }

    recommendRandomCity(location);

  }, [location, trafficOption, activeLocation, geoLoading, geoError]);

  const handleReroll = () => {
      if (!location) {
          toast.error("위치 정보를 기다리는 중입니다.");
          return;
      }
      // Clear persistence for current mode
      sessionStorage.removeItem(`traffic_recommendation_${trafficOption}`);
      // Re-run with current option
      recommendRandomCity(location, trafficOption);
  };

  const searchCenter = customCenter || activeLocation || { lat: 37.5665, lng: 126.9780 };

  useEffect(() => {
      if (trafficOption === 'far' && farDestination) {
         // toast.success(\`일상에서 벗어나 '\${farDestination.name}'(으)로 떠나보세요! ✈️\`, { icon: '🏙️', duration: 4000 }); // Removed as requested
      }
  }, [farDestination, trafficOption]);

  const contentTypeId = useMemo(() => {
     if (activeCategory === 'food') return 39;
     if (activeCategory === 'activity') return 28;
     return 12; 
  }, [activeCategory]);

  const searchOptions = useMemo(() => {
     const radius = trafficOption === 'far' ? 20000 : 15000; 
     const isCostSaving = priority === 'toll';
     return { radius, arrange: isCostSaving ? 'E' : 'P' };
  }, [priority, trafficOption]);

    const handleSaveCard = async (item, silent = false) => {
        if (!user) {
            if (!silent) toast.error("로그인이 필요합니다.");
            return;
        }
        
        try {
            const alreadySaved = await isPlaceSaved(user.id, item.title);
            if (alreadySaved) {
                if (!silent) toast.error("이미 저장된 장소입니다.");
                return;
            }
            
            await savePlace(user.id, {
                title: item.title,
                image: item.firstimage || item.image,
                country: item.addr1 ? item.addr1.split(" ")[0] : "대한민국",
                description: item.addr1 || "AI가 추천하는 드라이브 코스입니다.",
                tag: activeCategory === 'food' ? '맛집' : activeCategory === 'activity' ? '액티비티' : '힐링',
                category: 'traffic',
                matchScore: 90 + Math.floor(Math.random() * 10),
                ...item
            });
            
            await createNotification({
                user_id: user.id,
                type: 'save',
                message: `"${item.title}" 카드가 저장되었습니다.`,
                link: '/mypage'
            });
            
            if (!silent) toast.success(`"${item.title}" 저장 완료!`);
        } catch (error) {
            console.error('저장 실패:', error);
            if (!silent) toast.error("저장에 실패했습니다.");
        }
    };

  const distanceKm = useMemo(() => {
      if (!location || !searchCenter) return null;
      return haversineKm(location, searchCenter);
  }, [location, searchCenter]);

  // Query API
  const { data: tourItems = [], isLoading: apiLoading } = useLocationBasedTour({
    mapX: searchCenter.lng, mapY: searchCenter.lat, contentTypeId, radius: searchOptions.radius, arrange: searchOptions.arrange,
  });

  const isLoading = geoLoading || apiLoading;

  const rankedItems = useMemo(() => {
    // Override themes with activeCategory
    const currentThemes = [activeCategory];
    let ranked = rankTourItems(tourItems, { priority, budget, duration, themes: currentThemes });
    const sequenced = sequenceRoute(ranked, currentThemes);
    const MAX_PER_COURSE = 4;
    const rawCourses = [
        sequenced.slice(0, MAX_PER_COURSE),
        sequenced.slice(MAX_PER_COURSE, MAX_PER_COURSE * 2),
        sequenced.slice(MAX_PER_COURSE * 2, MAX_PER_COURSE * 3)
    ].filter(course => course.length > 0);

    return rawCourses;
  }, [tourItems, priority, budget, duration, activeCategory, budgetAmount]);

  useEffect(() => {
    if (!map || !kakao?.maps) return;
    if (customCenter) return; 
    const target = activeLocation || { lat: 37.5665, lng: 126.9780 };
    
    const moveLatLon = new kakao.maps.LatLng(target.lat, target.lng);
    map.setCenter(moveLatLon);
    map.setLevel(9);
  }, [map, kakao, activeLocation, customCenter]);

  useEffect(() => {
    if (!map || !kakao) return;
    const markers = [];
    const polylines = [];
    const COURSE_STYLES = [{ color: '#DC3232' }, { color: '#1E64F0' }, { color: '#14A050' }];

    if (rankedItems.length > 0) {
      rankedItems.forEach((courseItems, courseIdx) => {
          if(!courseItems || courseItems.length === 0) return;
          const style = COURSE_STYLES[courseIdx % 3];
          courseItems.forEach((item, index) => {
            if (!item.mapy || !item.mapx) return;
            const content = document.createElement('div');
            content.className = `custom-overlay-marker`;
            content.innerHTML = `<span class="marker-number">${index + 1}</span>`;
            content.style.cssText = `
                width: 28px; height: 28px; background-color: ${style.color}; color: white; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;
                box-shadow: none;
            `;
            const overlay = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx)), content, yAnchor: 1.1 });
            overlay.setMap(map);
            markers.push(overlay);
            content.onclick = () => openDetail(item);
          });
          const linePath = courseItems.filter(it => it.mapy && it.mapx).map(it => new kakao.maps.LatLng(parseFloat(it.mapy), parseFloat(it.mapx)));
          if (linePath.length > 1) {
            const polyline = new kakao.maps.Polyline({ path: linePath, strokeWeight: 5, strokeColor: style.color, strokeOpacity: 0.8, strokeStyle: 'shortdash' });
            polyline.setMap(map);
            polylines.push(polyline);
          }
      });
      if (rankedItems[0]?.[0]) {
          const first = rankedItems[0][0];
          map.setCenter(new kakao.maps.LatLng(parseFloat(first.mapy), parseFloat(first.mapx)));
      }
    }
    return () => { markers.forEach(m => m.setMap(null)); polylines.forEach(p => p.setMap(null)); };
  }, [map, kakao, rankedItems]);

  const handleSearch = () => {
    if (!map || !keyword || !kakao) return;
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const place = data[0];
            map.setCenter(new kakao.maps.LatLng(place.y, place.x));
            map.setLevel(9);
            setCustomCenter({ lat: parseFloat(place.y), lng: parseFloat(place.x) });
            setHasInteracted(true); // ✅ Search Triggered
            // toast.success("새로운 지역에서 코스를 찾습니다!"); // Removed as requested
        } else { 
            // toast.error("장소를 찾을 수 없습니다."); // Removed as requested
        }
    });
  };

  const handleKeyDown = (e) => { if(e.key === 'Enter') handleSearch(); };

  const [selected, setSelected] = useState(null);
  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  // ✅ Force sync people with companion state
  useEffect(() => {
      if (companion === 'solo') setPeople(1);
      else if (companion === 'family') setPeople(4);
      else setPeople(2);
  }, [companion]);

  const openDetail = (item) => {
    setSelected(item); 
    setNights(1); 
    // ✅ Reset people based on companion
    if (companion === 'solo') setPeople(1);
    else if (companion === 'family') setPeople(4);
    else setPeople(2);

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
        category: 'traffic',
        detail
    });
    setDiffResult(simpleDiff(planText, improved)); setPlanText(improved);
  };

  const getCourseCost = (items) => {
      let total = 0;
      items.forEach(item => {
          total += estimateItemCost(item, people, nights);
      });
      return total;
  };

  const { mood } = useTripStore();
  const weatherLat = activeLocation?.lat || location?.lat || 37.5665;
  const weatherLng = activeLocation?.lon || activeLocation?.lng || location?.lng || 126.9780;
  const { data: weather } = useWeather(weatherLat, weatherLng);

  const bioMatch = useMemo(() => {
      if (!weather || !mood) return null;
      const temp = weather.temperature;
      if (weather.weatherCode >= 50) return { color: '#90caf9', msg: `비 오는 날, **${mood}** 음악과 함께하는 드라이브 어때요? ☔` };
      if (temp > 28) return { color: '#ffcc80', msg: `무더위엔 에어컨 켜고 **${mood}** 바다 드라이브! 🌊` };
      return { color: '#a5d6a7', msg: `오늘(${temp}°C), **${mood}** 감성과 딱 맞는 드라이브 날씨예요! 🚗` };
  }, [weather, mood]);

  const handleSaveCourse = async (courseItems, courseTitle) => {
      if (!courseItems || courseItems.length === 0) return;
      
      const totalCost = getCourseCost(courseItems);
      const payload = {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          createdAt: new Date().toISOString(),
          type: 'course', 
          title: `${courseTitle} (${trafficOption === 'near' ? '근교' : '장거리'})`,
          subtitle: `총 ${courseItems.length}개 스팟 | 예상비용 ${totalCost.toLocaleString()}원`,
          heroImage: courseItems[0].firstimage || courseItems[0].image,
          nights,
          people,
          items: courseItems, 
          totalCost,
          // ✅ Wellness Data
          wellness: {
              noise: Math.floor(Math.random() * 30 + 40),
              light: Math.floor(Math.random() * 800 + 200),
              crowd: ['원활', '서행', '정체'][Math.floor(Math.random() * 3)] 
          },
          mood: mood || 'active',
          planText: courseItems.map((it, i) => `${i+1}. ${it.title} (${estimateBudgetLevel(it).label})`).join('\n')
      };

      try {
          await addPlan({ ...payload, category: "traffic" });
          toast.success(`'${courseTitle}'가 전체 저장되었습니다! 📂`);
      } catch (e) {
          console.error(e);
          toast.error("저장 중 오류가 발생했습니다.");
      }
  };

  // ✅ Reset Search on Mount (Updated per user request)
  useEffect(() => {
    setKeyword("");
    setCustomCenter(null);
  }, []);

  return (
    <div className="pageWrap">
      {/* Global Loading Overlay */}
      {isLoading && <LoadingOverlay message="열심히 드라이브 코스를 찾는 중이에요!" icon="🚗" />}
      {/* Bio Weather Banner */}
      {bioMatch && (
          <div style={{ margin: '0 auto 16px', maxWidth: '600px', background: `rgba(92, 148, 255, 0.15)`, padding: '12px 20px', borderRadius: '30px', border: `1px solid ${bioMatch.color}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🌡️</span>
              <div>
                  <div style={{ fontSize: '0.85rem', color: '#ccc' }}>바이오리듬 날씨 매칭</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{bioMatch.msg}</div>
              </div>
          </div>
      )}

      <div className="pageDesc" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', minHeight: '0' }}>
         {/* {geoLoading && <span style={{color:'#666'}}>📡 GPS 수신 중... (기본: 서울)</span>} Removed as requested */}
         {geoError && (
            <>
                <span style={{color:'#d9534f'}}>⚠️ 위치 권한 필요 (현재: 서울 기준).</span>
                <button onClick={requestLocation} style={{ padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#fff' }}>권한 요청</button>
            </>
         )}
      </div>



       {/* ✅ Category Tabs */}
      {/* ✅ Filters: Category & Distance */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          
          {/* Theme Tabs (액티비티 / 맛집 / 힐링) - First */}
          {['activity', 'food', 'healing'].map((cat) => {
             const activeColor = cat === 'food' ? '#ef4444' : (cat === 'healing' ? '#10b981' : '#3b82f6');
             return (
              <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 style={{
                     padding: '10px 24px',
                     borderRadius: '50px',
                     border: activeCategory === cat ? 'none' : '1px solid #e0e0e0',
                     background: activeCategory === cat ? activeColor : '#fff',
                     color: activeCategory === cat ? '#ffffff' : '#555',
                     fontWeight: 'bold',
                     cursor: 'pointer',
                     fontSize: '0.95rem',
                     boxShadow: 'none',
                     transition: 'all 0.2s',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '6px'
                 }}
              >
                 {cat === 'activity' ? '🪂 액티비티' : cat === 'food' ? '🍽️ 맛집' : '🌿 힐링'}
              </button>
             );
          })}

          <div style={{ width: '1px', height: '40px', background: '#eee', margin: '0 8px' }}></div>

          {/* Distance Toggle (근교 / 멀리) - Second */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '50px', padding: '4px' }}>
              {['near', 'far'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                        useTripStore.getState().setTrafficOption(opt);
                        if (location) {
                            recommendRandomCity(location, opt); 
                        }
                    }}
                    style={{
                        padding: '8px 20px',
                        borderRadius: '50px',
                        border: 'none',
                        background: trafficOption === opt ? '#fff' : 'transparent',
                        color: trafficOption === opt ? '#333' : '#888',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: trafficOption === opt ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                    }}
                  >
                      {opt === 'near' ? '🏙️ 근교' : '🛣️ 멀리'}
                  </button>
              ))}
          </div>

      </div>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div id="map" ref={mapRef} className="mapContainer"></div>
          <WeatherWidget lat={searchCenter.lat} lon={searchCenter.lng} absolute={true} />
          
          {/* ✅ Distance Overlay Badge */}
            <div 
                className="distance-badge-container"
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10,
                }}
                onMouseEnter={() => setIsDistHovered(true)}
                onMouseLeave={() => setIsDistHovered(false)}
            >
                {/* Badge Header */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    padding: '8px 18px',
                    borderRadius: '50px',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '800',
                    color: '#333',
                    fontSize: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: isDistHovered ? 'scale(1.02)' : 'scale(1)'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                    <span>{Math.round(distanceKm)}km</span>
                </div>

                {/* Expanded Card (Like WeatherWidget) */}
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    left: 0,
                    background: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '16px',
                    padding: '16px',
                    width: '260px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '1px solid #f0f0f0',
                    opacity: isDistHovered ? 1 : 0,
                    visibility: isDistHovered ? 'visible' : 'hidden',
                    transform: isDistHovered ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    pointerEvents: isDistHovered ? 'auto' : 'none',
                    zIndex: 101,
                    textAlign: 'left'
                }}>
                    <div style={{ marginBottom: '8px', fontSize: '0.9rem', color: '#555', fontWeight: 'bold' }}>
                         🚗 드라이브 거리 정보
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#666' }}>
                           <span>⏱️</span>
                           <span>예상 소요 시간: <strong style={{color:'#333'}}>{Math.round(distanceKm / 60 * 60)}분 ~ {Math.round(distanceKm / 40 * 60)}분</strong></span>
                        </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#666' }}>
                           <span>⛽</span>
                           <span>추천 통행: <strong style={{color:'#333'}}>{distanceKm > 100 ? '고속도로 추천' : '국도 드라이브'}</strong></span>
                        </div>
                    </div>

                    <div style={{ 
                        marginTop: '12px', 
                        background: '#f0f7ff', 
                        color: '#2563eb', 
                        padding: '10px', 
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        lineHeight: '1.4'
                    }}>
                       💡 {distanceKm > 100 ? '장거리 운전이네요! 휴게소 들러서 스트레칭 필수! 🧘' : '가벼운 근교 나들이! 좋아하는 음악과 함께 달려봐요 🎵'}
                    </div>
                </div>
            </div>

          {/* ✅ Reroll Button (Bottom Right) - Always visible for both Near/Far */}
          {trafficOption && (
              <button 
                onClick={handleReroll}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 10,
                    padding: '10px 18px',
                    fontSize: '0.95rem',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: '#333',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                    fontWeight: '800',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                  🔄 다른 지역 추천받기
              </button>
          )} 
      </div>

      <div className="searchContainer" style={{ marginBottom: '40px' }}>
          <input 
              type="text" 
              placeholder={
                  activeCategory === 'activity' ? "어떤 지역의 액티비티를 찾으시나요?" :
                  activeCategory === 'food' ? "어디 지역의 맛집을 찾으시나요?" :
                  "어디 지역에서 힐링하고 싶으신가요?"
              }
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="searchInput"
          />
          <button onClick={handleSearch} className="searchBtn" style={{ background: '#3b82f6' }}>검색</button>
      </div>

      {hasInteracted && (
      <div className="coursesContainer" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {/* Recommendation Header Removed */ /*
        <div style={{ padding: '20px 0 0' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px', color: '#1a1a1a' }}>
               ✨ {user ? user.email.split('@')[0] : (guestId ? `비회원${guestId.slice(0,4)}` : '여행러')}님을 위한 추천
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>AI가 분석한 맞춤형 드라이브 코스예요!</p>
        </div>
        */ }

        {/* Divider Removed <div style={{ width: '100%', height: '1px', background: '#eee' }}></div> */}

        {/* Personalized Tagline - Show only once at the top */}
        {(rankedItems && Array.isArray(rankedItems) && rankedItems.length > 0) && (() => {
            // Personalized Tagline Generator
            const getBudgetText = () => {
                if (budgetAmount) {
                    if (budgetAmount <= 300000) return '가성비';
                    if (budgetAmount <= 500000) return '적당히';
                    return '럭셔리';
                }
                if (budget === 'low') return '가성비';
                if (budget === 'mid') return '적당히';
                if (budget === 'high') return '럭셔리';
                return '맞춤';
            };
            const getCompanionText = () => {
                if (companion === 'solo') return '혼자';
                if (companion === 'couple') return '연인과';
                if (companion === 'friends') return '친구들과';
                if (companion === 'family') return '가족과';
                return '함께';
            };
            const getActivityText = () => {
                if (activeCategory === 'food') return '맛집 탐방';
                if (activeCategory === 'activity') return '액티비티';
                return '힐링 산책';
            };
            
            const getActivityColor = () => {
                if (activeCategory === 'food') return '#EF4444'; // Red for Food
                if (activeCategory === 'activity') return '#3B82F6'; // Blue for Activity
                return '#10B981'; // Green for Healing
            };
            
            const isSolo = companion === 'solo';

            return (
                <div style={{ 
                    marginTop: '10px',
                    marginBottom: '2px', 
                    paddingBottom: '4px', 
                    borderBottom: '2px solid #e0e0e0' 
                }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                        <span style={{ color: '#5C94FF', fontWeight: '700' }}>{getBudgetText()}</span> 예산에 맞는{' '}
                        <span style={{ color: '#5C94FF', fontWeight: '700' }}>{getCompanionText()}</span>{isSolo ? '하는' : ' 함께하는'}{' '}
                        <span style={{ color: getActivityColor(), fontWeight: '700' }}>{getActivityText()}</span> 코스에요 ✨
                    </h3>
                </div>
            );
        })()}

        {(rankedItems && Array.isArray(rankedItems) && rankedItems.length > 0) ? rankedItems.map((courseItems, courseIdx) => {
            const courseColor = ['#DC3232', '#1E64F0', '#14A050'][courseIdx % 3];
            const estimatedCost = getCourseCost(courseItems);

            return (
                <div key={`course-${courseIdx}`} className="courseSection" style={{ marginTop: courseIdx === 0 ? '13px' : '40px' }}>
                    <div className="grid">
                        {courseItems.map((it, index) => {
                            const matchScore = 90 + Math.floor((Math.random() * 10) - (index * 2));
                            return (
                                <div key={it.contentid} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                                    <RecommendationCard 
                                        title={it.title} 
                                        country={it.addr1 ? it.addr1.split(" ")[0] : "대한민국"}
                                        tag={activeCategory === 'activity' ? '액티비티' : activeCategory === 'food' ? '맛집' : '힐링'}
                                        desc={it.addr1 || "멋진 드라이브 코스입니다."}
                                        image={it.firstimage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"} 
                                        matchScore={matchScore}
                                        onLike={() => handleSaveCard(it)}
                                        onSave={() => handleSaveCard(it)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => handleSaveCourse(courseItems, `드라이브 코스 ${courseIdx+1}`)}
                        style={{
                            marginTop: '35px', /* Adjusted to 35px */
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
      )}

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
        onImprove={handleImprove} 
        onSave={async (payload) => { 
          try {
            // 메인 페이지에서는 '선택 완료' 시 '저장된 장소'로 저장합니다.
            if (selected) {
              await handleSaveCard(selected);
            }
            toast.success("저장된 장소에 추가되었습니다!"); 
            setSelected(null);
          } catch (e) {
            console.error('Save failed:', e);
            toast.error(e.message);
          }
        }} 
        improveLabel="AI 자동 보완" 
      />
    </div>
  );
}