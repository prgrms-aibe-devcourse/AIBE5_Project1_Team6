import { useMemo, useState } from "react";
import { useWeather } from "../hooks/useWeather";
import toast from "react-hot-toast";
import DestinationCard from "../components/DestinationCard";
import TripDetailDrawer from "../components/TripDetailDrawer";
import { addPlan } from "../services/plansStorage";
import { clothingTip } from "../services/weather";
import { improvePlanText } from "../services/aiPlanner";
import { simpleDiff } from "../services/diff";
import { searchCity, getPointsOfInterest } from "../services/amadeus";
import OSMMap from "../components/OSMMap";
import "../styles/cards.css";
import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";

const badgeOf = (safety) => {
  if (safety === "safe") return { badgeLeftTop: "SAFE", badgeColor: "green" };
  if (safety === "risk") return { badgeLeftTop: "RISK", badgeColor: "red" };
  return { badgeLeftTop: "CHECK", badgeColor: "gray" };
};

export default function Airplane() {
  const { user } = useAuthStore();
  const guestId = localStorage.getItem(GUEST_KEY);
  
  const greeting = useMemo(() => {
    if (user) return `${user.email.split('@')[0]}님, 찾고 싶은 도시를 검색해주세요.`;
    if (guestId) return `비회원${guestId.slice(0, 4)}님, 찾고 싶은 도시를 검색해주세요.`;
    return "찾고 싶은 도시를 검색해주세요.";
  }, [user, guestId]);

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [destinations, setDestinations] = useState([]); 
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lon: 126.9780 });

  const [selected, setSelected] = useState(null);
  const [poiList, setPoiList] = useState([]); // Points of Interest for selected city
  const [isLoadingPoi, setIsLoadingPoi] = useState(false);

  const [nights, setNights] = useState(3);
  const [people, setPeople] = useState(2);
  const [planText, setPlanText] = useState("");
  const [diffResult, setDiffResult] = useState(null);

  const [weather, setWeather] = useState({
    loading: false,
    temp: null,
    wind: null,
    error: null,
  });

// 🖼️ 도시별 추천 이미지 (Unsplash Source가 불안정하므로 고정 URL 사용)
const CITY_IMAGES = {
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
  "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&w=800&q=80",
  "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80",
  "Osaka": "https://images.unsplash.com/photo-1590253230530-5b583f7de15a?auto=format&fit=crop&w=800&q=80",
  "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
  "Fukuoka": "https://images.unsplash.com/photo-1628173428236-077556096537?auto=format&fit=crop&w=800&q=80",
  "Sapporo": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=800&q=80",
  "Bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
  "Da Nang": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
  "Hanoi": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
  "Ho Chi Minh City": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80",
  "Singapore": "https://images.unsplash.com/photo-1565963030831-a7231a6d2716?auto=format&fit=crop&w=800&q=80",
  "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
  "Cebu": "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80",
  "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
  "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
  "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80",
  "Madrid": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80",
  "Zurich": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80",
  "Interlaken": "https://images.unsplash.com/photo-1490623970972-ae8bb3da443e?auto=format&fit=crop&w=800&q=80",
  "Honolulu": "https://images.unsplash.com/photo-1542259659-48c900645c3b?auto=format&fit=crop&w=800&q=80",
  "Guam": "https://images.unsplash.com/photo-1522851532053-40e159040333?auto=format&fit=crop&w=800&q=80",
  "Male": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
  "Hong Kong": "https://images.unsplash.com/photo-1506318137071-a8bcbf6d2806?auto=format&fit=crop&w=800&q=80",
  "Taipei": "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=800&q=80",
  "Seoul": "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80",
  "Busan": "https://images.unsplash.com/photo-1635411776943-2c49ee633d8e?auto=format&fit=crop&w=800&q=80",
  "Jeju": "https://images.unsplash.com/photo-1571326466399-6e3e1ba3d789?auto=format&fit=crop&w=800&q=80",
};

// Fallback images (Random travel vibes)
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
];

const getCityImage = (name) => {
    if (!name) return FALLBACK_IMAGES[0];

    // 1. Exact match (Case Insensitive)
    // e.g. "PARIS" === "Paris"
    const exactKey = Object.keys(CITY_IMAGES).find(key => 
        key.toLowerCase() === name.toLowerCase()
    );
    if (exactKey) return CITY_IMAGES[exactKey];

    // 2. Partial match (Case Insensitive)
    // e.g. "Paris, France" includes "Paris"
    const partialKey = Object.keys(CITY_IMAGES).find(key => 
        name.toLowerCase().includes(key.toLowerCase())
    );
    if (partialKey) return CITY_IMAGES[partialKey];

    // 3. Fallback
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
};

  // ✅ Search Handler
  const handleSearch = async () => {
    if (!keyword.trim()) {
        toast("도시 이름을 입력해주세요.");
        return;
    }

    setIsSearching(true);
    setDestinations([]); // Clear prev
    try {
        const results = await searchCity(keyword);
        if (results.length === 0) {
            toast("검색 결과가 없습니다 😢");
        } else {
            // Transform Amadeus data to our Card props format
            const mapped = results.map(city => ({
                id: city.id,
                title: city.name,
                subtitle: city.address?.countryName || "International",
                image: getCityImage(city.name), // ✅ Use Smart Image Mapping
                lat: city.geoCode.latitude,
                lon: city.geoCode.longitude,
                iata: city.iataCode,
                rateText: `${city.address?.countryCode || 'N/A'} Currency`,
                safety: "unknown"
            }));
            setDestinations(mapped);

            // ✅ Update Map Center to first result
            if (mapped.length > 0) {
                setMapCenter({ lat: mapped[0].lat, lon: mapped[0].lon });
            }
        }
    } catch (e) {
        toast.error("검색 중 오류가 발생했습니다: " + e.message);
    } finally {
        setIsSearching(false);
    }
  };

  const onKeyDown = (e) => {
      if (e.key === 'Enter') handleSearch();
  };

  const openDetail = async (item) => {
    setSelected(item);
    setNights(3);
    setPeople(2);
    setPlanText("");
    setDiffResult(null);
    setPoiList([]); // Clear previous API POIs
    
    // ✅ Fetch POIs for this location via Amadeus
    // If it's a mock item, we might still try? or just stick to mock data?
    // User requested "overseas search -> show recommendations".
    // Let's try fetching for all items to see if we can get real spots even for mock locations!
    
    setIsLoadingPoi(true);
    try {
        const pois = await getPointsOfInterest(item.lat, item.lon);
        if (pois && pois.length > 0) {
            const mappedPois = pois.map(p => ({
                title: p.name,
                sub: p.category, 
                // Use API image if available, else generic
                image: (p.images && p.images.length > 0) 
                    ? p.images[0] 
                    : "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=600&q=80" 
            }));
            setPoiList(mappedPois);
        } else {
             // No POIs found? If it was mock item, it has its own stays/foods, so it's fine.
        }
    } catch (e) {
        console.error("POI Fetch Error:", e);
        // Don't toast error if it's just auth error on default items, user might get annoyed
    } finally {
        setIsLoadingPoi(false);
    }
  };

  // ✅ TanStack Query로 날씨 데이터 관리 (Server State)
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather(selected?.lat, selected?.lon);

  // ✅ AI 자동 보완
  const handleImprove = () => {
    if (!selected) return;

    const improved = improvePlanText({
      title: selected.title,
      nights,
      people,
      planText,
      stays: [], // Amadeus doesn't typically return stays in Free tier POI, but we could put POIs here
      foods: [],
    });

    setDiffResult(simpleDiff(planText, improved));
    setPlanText(improved);
  };

  // ✅ Weather Display
  const WeatherSection = useMemo(() => {
    if (!selected) return null;

    const temp = weatherData?.temp;
    const wind = weatherData?.wind;

    let titleText = "날씨 정보 없음";
    let descText = "여행 날짜를 알려주면 더 정확히 추천할게요.";

    if (weatherLoading) {
        titleText = "현지 날씨 불러오는 중...";
        descText = "잠시만 기다려주세요.";
    } else if (weatherError) {
        titleText = "날씨 정보를 가져올 수 없습니다.";
        descText = "네트워크 상태를 확인해주세요.";
    } else if (temp != null) {
        titleText = `현재 기온: ${Math.round(temp)}°C ${wind ? `(바람 ${Math.round(wind)} m/s)` : ""}`;
        descText = clothingTip(temp);
    }

    return (
      <section className="drawerSection" style={{ marginTop: 8 }}>
        <h3>✈️ 현지 날씨 & 옷차림 Tip</h3>
        <div style={{
            padding: "16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(5px)"
        }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>
            {titleText}
          </div>
          <div style={{ fontSize: "0.95rem", opacity: 0.9, lineHeight: 1.5, color: "#e0e0e0" }}>
            {descText}
          </div>
        </div>
      </section>
    );
  }, [selected, weatherData, weatherLoading, weatherError]);

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Airplane · 해외 여행지 추천</h2>
      <p className="pageDesc">{greeting}</p>

      {/* ✅ Search Input */}
      <div className="searchContainer" style={{ maxWidth: '600px', margin: '20px auto' }}>
          <input
              type="text"
              placeholder="찾고 싶은 도시를 검색해주세요."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={onKeyDown}
              className="searchInput"
          />
          <button 
             onClick={handleSearch}
             className="searchBtn"
             disabled={isSearching}
          >
             {isSearching ? "검색 중..." : "검색"}
          </button>
      </div>

      {/* ✅ Main OSM Map */}
      <div style={{ width: "100%", height: "500px", marginBottom: "32px", borderRadius: "16px", overflow: "hidden" }}>
        <OSMMap 
            lat={mapCenter.lat} 
            lon={mapCenter.lon} 
            title={destinations.length > 0 ? destinations[0].title : "Seoul"} 
            style={{ height: "100%", marginTop: 0 }} 
            zoom={destinations.length > 0 ? 11 : 5}
        />
      </div>

      <div className="grid">
        {destinations.length > 0 ? (
            destinations.map((d) => {
                // Mock Data vs API Data Distinction
                // API data has 'iata', Mock data has 'safety' field directly
                // We reuse badgeOf for mocks if they have safety prop
                const extraProps = d.safety && d.safety !== "unknown" ? badgeOf(d.safety) : {};
                
                return (
                    <div key={d.id} onClick={() => openDetail(d)} style={{ cursor: "pointer" }}>
                        <DestinationCard
                        image={d.image} 
                        title={d.title}
                        subtitle={d.subtitle}
                        ratingText={d.iata ? `IATA: ${d.iata}` : "★ 4.9"} // API vs Mock
                        priceText={d.priceText || "추천 일정 3~6일"}
                        badge={d.iata ? d.subtitle : (extraProps.badgeLeftTop || "HOT")}
                        badgeColor={d.iata ? "blue" : (extraProps.badgeColor || "red")}
                        bottomLeftTag={d.rateText}
                        />
                    </div>
                );
            })
        ) : (
            // Empty State
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#888" }}>
                🌍 검색 가능한 여행지가 없습니다.
            </div>
        )}
      </div>

      {/* Inject POIs into Drawer via 'stays' prop hack or new prop */}
      <TripDetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        item={{
            ...selected,
            stays: poiList.length > 0 ? poiList : (selected?.stays || []), // Use API POIs if available, else mock stays
            foods: selected?.foods || []       
        }}
        nights={nights}
        setNights={setNights}
        people={people}
        setPeople={setPeople}
        planText={planText}
        setPlanText={setPlanText}
        extraTop={WeatherSection}
        onImprove={handleImprove}
        diffResult={diffResult}
        onSave={async (payload) => {
          await addPlan(payload);
          toast.success("플랜이 저장됐어요! (My Plans에서 확인 가능)");
        }}
      />
    </div>
  );
}