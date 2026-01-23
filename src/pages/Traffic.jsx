import { useEffect, useMemo, useState } from "react";
import { useKakaoMap } from "../hooks/useKakaoMap";
import { useLocationBasedTour } from "../hooks/queries/useTourQueries";
import { useGeolocation } from "../hooks/useGeolocation";
import { useTripStore } from "../stores/tripStore";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { improvePlanText } from "../services/aiPlanner";
import { addPlan } from "../services/plansStorage";
import "../styles/cards.css";
import { simpleDiff } from "../services/diff";
import { geocodeCity, haversineKm, KOREA_CITY_COORDS } from "../utils/geo";
import { rankTourItems } from "../services/recommend/rankTourItems";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "16px",
  marginBottom: "24px",
};

export default function Traffic() {
  // ✅ Use Custom Hook for Map (SRP)
  const { mapRef, map, isLoaded, kakao } = useKakaoMap();

  // ✅ Smart Recommendation Logic
  const { themes, priority, budget, duration } = useTripStore();
  const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();

  const contentTypeId = useMemo(() => {
     if (themes.includes('food')) return 39;
     if (themes.includes('activity')) return 28;
     return 12; // Default Healing/Spot
  }, [themes]);

  const searchOptions = useMemo(() => {
     // 'toll' = 비용 절약 -> 가까운 곳 (Save Gas/Distance) -> arrange='E'
     // 'fast' = 최단 시간 (Cost irrelevant) -> 인기 있는 곳/메인 도로 (Popularity) -> arrange='P'
     const isCostSaving = priority === 'toll';
     return {
        radius: (duration === 'day' ? 12000 : duration === 'short' ? 20000 : 35000), // day는 더 타이트, long은 더 넓게
        arrange: isCostSaving ? 'E' : 'P', // E=Distance, P=Popularity(View Count/Hotspots)
     };
  }, [priority]);

  // Traffic: Fallback to Seoul (or Jeju) if no location
  const defaultLocation = { lat: 37.5665, lng: 126.9780 }; // Seoul Station
  const activeLocation = location || defaultLocation;

  // ✅ 목적지 입력(도시) → 좌표로 변환 (선택 완료 후 결과 화면 UX)
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [destinationLabel, setDestinationLabel] = useState("");
  const [isResolvingCity, setIsResolvingCity] = useState(false);

  const mapCenter = destinationCoords || activeLocation;

  const distanceKm = useMemo(() => {
    if (!destinationCoords || !location) return null;
    return haversineKm(location, destinationCoords);
  }, [location, destinationCoords]);

  // Query API
  const { data: tourItems = [], isLoading: apiLoading } = useLocationBasedTour({
    mapX: mapCenter.lng,
    mapY: mapCenter.lat,
    contentTypeId,
    radius: searchOptions.radius,
    arrange: searchOptions.arrange,
  });

  const isLoading = geoLoading || apiLoading;

  const rankedItems = useMemo(() => {
    return rankTourItems(tourItems, { priority, budget, duration, themes });
  }, [tourItems, priority, budget, duration, themes]);

  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState("");

  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  // ✅ Initialize Map View & Markers
  useEffect(() => {
    if (!map || !kakao) return;

    // 목적지가 있으면 그쪽을 보여주고, 없으면 내 위치(또는 기본값) 기준
    map.setCenter(new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
    map.setLevel(9); // Wider view for Traffic

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
       
       // Center map on the first result if location specific
       // But we have our own location, so better stay there?
       // Let's stay at user location to show they are "near"
    }

    return () => {
        markers.forEach(m => m.setMap(null));
    };
  }, [map, kakao, rankedItems, mapCenter]);

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
            map.setLevel(9);
        } else {
            toast.error("장소를 찾을 수 없습니다.");
        }
    });
  };

  const handleKeyDown = (e) => {
      if(e.key === 'Enter') handleSearch();
  };

  const resolveDestinationCity = async () => {
    const q = destinationCity.trim();
    if (!q) {
      toast.error("여행할 도시를 입력해 주세요. (예: 서울, 구미)");
      return;
    }

    // 1) 로컬 fallback 우선
    if (KOREA_CITY_COORDS[q]) {
      setDestinationCoords(KOREA_CITY_COORDS[q]);
      setDestinationLabel(q);
      toast.success(`목적지를 '${q}'로 설정했어요.`);
      return;
    }

    // 2) Nominatim 지오코딩
    try {
      setIsResolvingCity(true);
      const result = await geocodeCity(q);
      if (!result) {
        toast.error("도시를 찾지 못했어요. (예: 서울, 부산, 제주)");
        return;
      }
      setDestinationCoords({ lat: result.lat, lng: result.lng });
      setDestinationLabel(q);
      toast.success(`목적지를 '${q}'로 설정했어요.`);
    } catch (e) {
      console.error(e);
      toast.error("도시 좌표를 불러오지 못했어요. 다른 도시명으로 시도해 주세요.");
    } finally {
      setIsResolvingCity(false);
    }
  };

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);

    // Zoom to location
    if (map && kakao && item.mapy && item.mapx) {
        const moveLatLon = new kakao.maps.LatLng(parseFloat(item.mapy), parseFloat(item.mapx));
        map.panTo(moveLatLon);
        map.setLevel(7);
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

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Traffic · 근교 드라이브 추천</h2>
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
          "내 주변 20km 반경의 추천 드라이브/여행 코스입니다."}
      </div>

      {budget === "good" && (
        <p className="funnelHint">가성비 추천은 TourAPI에 가격 정보가 없어, 키워드/콘텐츠 유형 기반으로 추정해요.</p>
      )}


      {/* ✅ 결과 화면: 도시 입력 → 내 위치와의 거리 + 해당 도시 관광지 추천 */}
      <div style={{ margin: '18px auto 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="여행할 도시를 입력하세요 (예: 서울, 구미, 제주)"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') resolveDestinationCity();
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid #3a3a3a',
              background: '#1b1b1b',
              color: 'white',
              fontSize: 15,
              outline: 'none',
            }}
          />
          <button
            onClick={resolveDestinationCity}
            disabled={isResolvingCity}
            style={{
              padding: '0 16px',
              borderRadius: '14px',
              border: 'none',
              background: '#d59563',
              color: '#fff',
              cursor: isResolvingCity ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              opacity: isResolvingCity ? 0.7 : 1,
            }}
          >
            {isResolvingCity ? '찾는 중...' : '적용'}
          </button>
        </div>

        {destinationCoords ? (
          <div style={{ marginTop: 10, fontSize: 13, color: '#bdbdbd' }}>
            <div>
              📍 목적지: <b style={{ color: 'white' }}>{destinationLabel || destinationCity}</b>
            </div>
            {distanceKm != null && (
              <div>
                🧭 내 위치에서 약 <b style={{ color: 'white' }}>{Math.round(distanceKm)}km</b>
                {' '}거리예요.
              </div>
            )}
            <div style={{ marginTop: 6, color: '#8d8d8d' }}>
              * 추천은 공공 관광 데이터 기반으로 <b>테마(맛집/액티비티/힐링)</b>와 <b>우선순위</b>를 반영해요.
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, color: '#8d8d8d' }}>
            도시를 설정하면, 그 도시 주변의 놀 거리/볼 거리를 보여줄게요.
          </div>
        )}
      </div>

      {/* 장소 검색 */}
      <div style={{ marginBottom: '20px', maxWidth: '400px', display: 'flex', gap: '8px' }}>
         <input
             type="text"
             placeholder="지역 검색 (예: 제주도, 강릉)"
             value={keyword}
             onChange={(e) => setKeyword(e.target.value)}
             onKeyDown={handleKeyDown}
             style={{
                 flex: 1,
                 padding: '12px 16px',
                 borderRadius: '24px',
                 border: '1px solid #555',
                 background: '#333',
                 color: 'white',
                 fontSize: '16px',
                 outline: 'none'
             }}
         />
         <button 
            onClick={handleSearch}
            style={{
                padding: '0 20px',
                borderRadius: '24px',
                border: 'none',
                background: '#d59563',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
            }}
         >
             검색
         </button>
      </div>

      <div id="map" ref={mapRef} style={mapContainerStyle}></div>

      <div className="grid">
        {isLoading ? (
            <p>여행지 불러오는 중...</p>
        ) : (
            rankedItems.map((it) => (
            <div key={it.contentid} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                <DestinationCard 
                     title={it.title}
                     subtitle={it.addr1}
                     image={it.firstimage || "https://images.unsplash.com/photo-1516934524453-3c224b5d6389?auto=format&fit=crop&w=1200&q=80"}
                     ratingText="★ 4.7"
                     priceText="추천 여행지"
                     badge="HOT"
                     badgeColor="red"
                />
            </div>
            ))
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
        diffResult={diffResult}
        onImprove={handleImprove}
        onSave={async (payload) => {
            await addPlan({ ...payload, category: "traffic" });
            toast.success("플랜이 저장됐어요! (My Plans에서 확인 가능)");
            setSelected(null);
        }}
        improveLabel="AI 자동 보완"
      />
    </div>
  );
}