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

import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";

export default function Walk() {
  // ✅ Map (SRP)
  const { mapRef, map, kakao } = useKakaoMap();
  const { user } = useAuthStore();
  const guestId = localStorage.getItem(GUEST_KEY);

  // ✅ Smart Recommendation Engine Logic
  const { themes = [], priority = '', budget = null, duration = null } = useTripStore();
  const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();



  // Calculate greeting
  const greeting = useMemo(() => {
    if (user) return `${user.email.split('@')[0]}님, 내 주변 맞춤 산책 코스를 추천해드립니다.`;
    if (guestId) return `비회원${guestId.slice(0, 4)}님, 내 주변 맞춤 산책 코스를 추천해드립니다.`;
    return "내 주변 맞춤 산책 코스를 추천해드립니다.";
  }, [user, guestId]);

  // Map Themes to ContentType
  const contentTypeId = useMemo(() => {
     if (!themes || !Array.isArray(themes)) return 12;
     if (themes.includes('food')) return 39;
     if (themes.includes('activity')) return 28;
     return 12; // Default Healing/Spot
  }, [themes]);

  // Radius & Sorting based on Priority
  // Energy Saving = Closer (arrange=E), smaller radius
  const searchOptions = useMemo(() => {
     // 'stamina' = 체력 절약 -> 가까운 순 (Distance)
     const isEnergySaving = priority === 'stamina';

     // duration: day(당일/1박)일수록 반경을 타이트하게
     const radiusByDuration =
        duration === 'day' ? 2500 :
        duration === 'short' ? 6000 :
        9000;

     return {
        radius: isEnergySaving ? Math.min(2000, radiusByDuration) : radiusByDuration,
        arrange: isEnergySaving ? 'E' : 'Q', // E=Distance, Q=Modified
     };
  }, [priority, duration]);

  // ✅ Fallback Location
  const defaultLocation = { lat: 37.5665, lng: 126.9780 }; // Seoul Station
  const activeLocation = location || defaultLocation;
  
  // ✅ Custom Search Center (User Clicked)
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
    return rankTourItems(tourItems, { priority, budget, duration, themes });
  }, [tourItems, priority, budget, duration, themes]);

  // Update map center when location is found (only if user hasn't moved it yet)
  useEffect(() => {
    if (!map || !kakao?.maps) return;
    if (customCenter) return; // Don't override user's manual selection

    const target = location || defaultLocation;
    map.setCenter(new kakao.maps.LatLng(target.lat, target.lng));
    map.setLevel(location ? 4 : 5);
  }, [map, kakao, location, customCenter]);

  // ✅ Add Click Listener to Map
  useEffect(() => {
    if (!map || !kakao) return;

    const clickHandler = (mouseEvent) => {
        const latlng = mouseEvent.latLng;
        const newCenter = {
            lat: latlng.getLat(),
            lng: latlng.getLng()
        };
        setCustomCenter(newCenter);
        map.panTo(latlng);
        toast.success("이 지역 중심으로 다시 검색합니다!");
    };

    kakao.maps.event.addListener(map, 'click', clickHandler);

    return () => {
        kakao.maps.event.removeListener(map, 'click', clickHandler);
    };
  }, [map, kakao]);

  // ✅ Initialize Markers (Smart)

  // ✅ Local UI State
  // Walk 페이지 진입 시 keyword/selected 등이 선언되지 않으면
  // ReferenceError로 React 트리가 통째로 언마운트되어 "흰 화면"이 됩니다.
  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState("");

  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  // ✅ Initialize Markers when map is loaded
  useEffect(() => {
    if (!map || !kakao) return;

    // React StrictMode(개발 모드)에서는 effect가 2번 실행될 수 있어
    // 마커가 중복 생성되는 걸 막기 위해 cleanup을 준비해둡니다.
    const markers = [];

    if (rankedItems.length > 0) {
      rankedItems.forEach((item) => {
        if (!item.mapx || !item.mapy) return;
        
        const lat = parseFloat(item.mapy);
        const lng = parseFloat(item.mapx);
        const markerPosition = new kakao.maps.LatLng(lat, lng);
        
        const marker = new kakao.maps.Marker({ position: markerPosition });
        marker.setMap(map);

        markers.push(marker);

        kakao.maps.event.addListener(marker, 'click', () => {
          openDetail(item);
        });
      });
      
      // Move map center to the first item of the new list if available
      if (rankedItems[0].mapy && rankedItems[0].mapx) {
          const firstLat = parseFloat(rankedItems[0].mapy);
          const firstLng = parseFloat(rankedItems[0].mapx);
          map.setCenter(new kakao.maps.LatLng(firstLat, firstLng));
      }
    }

    return () => {
      markers.forEach((m) => m.setMap(null));
    };
  }, [map, kakao, rankedItems]);

  // Handle Search
  const handleSearch = () => {
    if (!map || !keyword || !kakao) return;
    
    if(!kakao.maps.services || !kakao.maps.services.Places){
        toast.error("지도 검색 서비스를 사용할 수 없습니다.");
        return;
    }

    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
            const place = data[0];
            const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
            map.setCenter(moveLatLon);
            map.setLevel(4);
        } else {
            toast.error("장소를 찾을 수 없습니다.");
        }
    });
  };

  const handleKeyDown = (e) => {
      if(e.key === 'Enter') handleSearch();
  };

  // Polyline ref (향후 코스 경로 데이터 도입 시 사용)
  const polylineRef = useRef(null);

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    
    if (map && kakao && item.mapy && item.mapx) {
        const moveLatLon = new kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx));
        map.panTo(moveLatLon);
        
        // 기존 폴리라인 제거
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }

        // Note: The API currently fetches spot lists which might not have path data.
        // If we want paths, we need specifically Course data or path arrays.
        // Keeping polyline logic just in case we fetch course details later.
        /* 
        // 새 폴리라인 그리기
        if (item.path && item.path.length > 0) {
            const linePath = item.path.map(p => new kakao.maps.LatLng(p.lat, p.lng));
            
            const polyline = new kakao.maps.Polyline({
                path: linePath,
                strokeWeight: 5,
                strokeColor: '#FF0000',
                strokeOpacity: 0.7,
                strokeStyle: 'solid'
            });
            
            polyline.setMap(map);
            polylineRef.current = polyline;
        }
        */
    }
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

  const onSave = async (payload) => {
    try {
      await addPlan({ ...payload, category: "walk" });
      toast.success("플랜이 저장됐어요! (My Plans에서 확인 가능)");
      setSelected(null);
    } catch (e) {
      toast.error(e.message);
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
          ) : 
          greeting}
      </div>

      {budget === "good" && (
        <p className="funnelHint">가성비 추천은 TourAPI에 가격 정보가 없어, 키워드/콘텐츠 유형 기반으로 추정해요.</p>
      )}


      {/* 장소 검색 (Kakao Keyword Search - Optional Backup) */}
      <div className="searchContainer">
         <input
             type="text"
             placeholder="지역이나 장소를 검색하세요 (예: 잠실역, 부산역)"
             value={keyword}
             onChange={(e) => setKeyword(e.target.value)}
             onKeyDown={handleKeyDown}
             className="searchInput"
         />
         <button 
            onClick={handleSearch}
            className="searchBtn"
         >
             검색
         </button>
      </div>

      {/* 대형 지도 영역 */}
      <div id="map" ref={mapRef} className="mapContainer"></div>

      {/* 하단 리스트 (모든 추천 코스) */}
      <h3 className="sectionTitle">
        {isLoading ? "로딩 중..." : "추천 산책 코스"}
      </h3>
      <div className="grid">
        {(rankedItems && Array.isArray(rankedItems)) ? rankedItems.map((it) => (
            <div key={it.contentid} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                <DestinationCard
                title={it.title}
                subtitle={it.addr1}
                image={it.firstimage || "https://images.unsplash.com/photo-1533658280665-224492bf552f?auto=format&fit=crop&w=800&q=80"}
                rateText={"⭐ 4.5"}
                badge={"INFO"}
                badgeColor={"blue"}
                />
            </div>
        )) : null}
        {(!tourItems || tourItems.length === 0) && !isLoading && (
            <p>데이터가 없습니다.</p>
        )}
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
        onImprove={handleImprove}
        onSave={onSave}
        improveLabel="AI 자동 보완"
        diffResult={diffResult}
      />
    </div>
  );
}