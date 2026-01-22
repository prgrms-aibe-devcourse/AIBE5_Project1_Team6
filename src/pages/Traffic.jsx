import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { trafficDestinations } from "../data/trafficDestinations";
import { improvePlanText } from "../services/aiPlanner";
import { addPlan } from "../services/plansStorage";
import "../styles/cards.css";
import { simpleDiff } from "../services/diff";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "16px",
  marginBottom: "24px",
};

export default function Traffic() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState("");

  const [nights, setNights] = useState(1);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  useEffect(() => {
    const initMap = () => {
        const { kakao } = window;
        if (!kakao || !kakao.maps) {
            return false;
        }

        kakao.maps.load(() => {
            const container = mapRef.current;
            if (container.hasChildNodes()) return;

            const options = {
                center: new kakao.maps.LatLng(36.5, 127.5), // 한국 중심 대략
                level: 13
            };
            const mapInstance = new kakao.maps.Map(container, options);
            setMap(mapInstance);

            // Destinations markers
            trafficDestinations.forEach((item) => {
                if (item.lat && item.lon) {
                    const markerPosition = new kakao.maps.LatLng(item.lat, item.lon);
                    const marker = new kakao.maps.Marker({
                        position: markerPosition
                    });
                    marker.setMap(mapInstance);

                    kakao.maps.event.addListener(marker, 'click', () => {
                        openDetail(item);
                    });
                }
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
            map.setLevel(9);
        } else {
            toast.error("장소를 찾을 수 없습니다.");
        }
    });
  };

  const handleKeyDown = (e) => {
      if(e.key === 'Enter') handleSearch();
  };

  const openDetail = (item) => {
    setSelected(item);
    setNights(1);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);

    if (map && item.lat && item.lon) {
        const moveLatLon = new window.kakao.maps.LatLng(item.lat, item.lon);
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
      <h2 className="pageTitle">Traffic · 국내 여행지 추천</h2>
      <p className="pageDesc">원하는 여행지를 검색하거나 카드를 클릭해보세요.</p>

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
        {trafficDestinations.map((it) => (
          <div key={it.id} onClick={() => openDetail(it)} style={{ cursor: "pointer" }}>
            <DestinationCard {...it} />
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