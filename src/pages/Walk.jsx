import { useEffect, useRef, useState } from "react";
import { useKakaoMap } from "../hooks/useKakaoMap";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { walkCourses } from "../data/walkRegions";
import "../styles/cards.css";
import "./Walk.css";
import { addPlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";

export default function Walk() {
  // ✅ Use Custom Hook for Map (SRP)
  const { mapRef, map, isLoaded, kakao } = useKakaoMap();

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

    walkCourses.forEach((course) => {
      const markerPosition = new kakao.maps.LatLng(course.lat, course.lon);
      const marker = new kakao.maps.Marker({ position: markerPosition });
      marker.setMap(map);

      markers.push(marker);

      kakao.maps.event.addListener(marker, 'click', () => {
        openDetail(course);
      });
    });

    return () => {
      markers.forEach((m) => m.setMap(null));
    };
  }, [map, kakao]);

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

  // Polyline ref
  const polylineRef = useRef(null);

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    
    if (map && kakao) {
        const moveLatLon = new kakao.maps.LatLng(item.lat, item.lon);
        map.panTo(moveLatLon);
        
        // 기존 폴리라인 제거
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }

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
      <p className="pageDesc">원하는 동네를 검색해서 이동해보세요! 주변 산책 코스를 찾아드립니다.</p>

      {/* 장소 검색 (Kakao Keyword Search) */}
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
      <h3 className="sectionTitle">추천 산책 코스</h3>
      <div className="grid">
        {walkCourses.map((it) => (
            <div key={it.id} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
                <DestinationCard
                title={it.title}
                subtitle={it.subtitle}
                image={it.image}
                rateText={it.rateText}
                badge={it.safety === "safe" ? "SAFE" : "CHECK"}
                badgeColor={it.safety === "safe" ? "green" : "gray"}
                />
            </div>
        ))}
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