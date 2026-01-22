import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { walkCourses } from "../data/walkRegions";
import "../styles/cards.css";
import { addPlan } from "../services/plansStorage";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "16px",
  marginBottom: "24px",
};

export default function Walk() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selected, setSelected] = useState(null);
  
  // Search input state
  const [keyword, setKeyword] = useState("");

  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);
  
  // 마커 인스턴스를 저장할 필요가 있을 경우를 위해 (여기선 간단히)
  
  useEffect(() => {
    const initMap = () => {
        const { kakao } = window;
        if (!kakao || !kakao.maps) {
            return false;
        }

        kakao.maps.load(() => {
            const container = mapRef.current;
            // 이미 맵이 있으면 초기화 방지
            if (container.hasChildNodes()) return;

            const options = {
                center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
                level: 7
            };
            const mapInstance = new kakao.maps.Map(container, options);
            setMap(mapInstance);

            // 모든 코스 마커 표시
            walkCourses.forEach((course) => {
                const markerPosition = new kakao.maps.LatLng(course.lat, course.lon);
                const marker = new kakao.maps.Marker({
                    position: markerPosition
                });
                marker.setMap(mapInstance);

                // 마커 클릭 이벤트
                kakao.maps.event.addListener(marker, 'click', () => {
                    openDetail(course);
                });
            });
        });
        return true;
    };

    if (!initMap()) {
        const intervalId = setInterval(() => {
            if (initMap()) {
                clearInterval(intervalId);
            }
        }, 500);
        return () => clearInterval(intervalId);
    }
  }, []);

  const handleSearch = () => {
    if (!map || !keyword) return;
    
    if(!window.kakao.maps.services || !window.kakao.maps.services.Places){
        toast.error("지도 검색 서비스를 사용할 수 없습니다.");
        return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
            const place = data[0];
            const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
            map.setCenter(moveLatLon);
            map.setLevel(4);
        } else {
            toast.error("장소를 찾을 수 없습니다.");
        }
    });
  };

  const handleKeyDown = (e) => {
      if(e.key === 'Enter') {
          handleSearch();
      }
  };

  // Polyline ref
  const polylineRef = useRef(null);

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    
    if (map) {
        const moveLatLon = new window.kakao.maps.LatLng(item.lat, item.lon);
        map.panTo(moveLatLon);
        
        // 기존 폴리라인 제거
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }

        // 새 폴리라인 그리기
        if (item.path && item.path.length > 0) {
            const linePath = item.path.map(p => new window.kakao.maps.LatLng(p.lat, p.lng));
            
            const polyline = new window.kakao.maps.Polyline({
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
      <div style={{ marginBottom: '20px', maxWidth: '400px', display: 'flex', gap: '8px' }}>
         <input
             type="text"
             placeholder="지역이나 장소를 검색하세요 (예: 잠실역, 부산역)"
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

      {/* 대형 지도 영역 */}
      <div id="map" ref={mapRef} style={mapContainerStyle}></div>

      {/* 하단 리스트 (모든 추천 코스) */}
      <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>추천 산책 코스</h3>
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