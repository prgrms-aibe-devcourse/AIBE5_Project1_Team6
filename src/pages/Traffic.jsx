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
import { addPlan } from "../services/plansStorage";
import "../styles/cards.css";
import "./Walk.css";
import { simpleDiff } from "../services/diff";
import { haversineKm, KOREA_CITY_COORDS } from "../utils/geo";
import { rankTourItems } from "../services/recommend/rankTourItems";
import { sequenceRoute } from "../services/recommend/sequenceRoute";
import { estimateBudgetLevel, estimateItemCost } from "../services/recommend/estimateBudget";
import { useAuthStore } from "../stores/authStore";
import { useWeather } from "../hooks/useWeather";
import { GUEST_KEY } from "../utils/guestUtils";

export default function Traffic() {
    const { mapRef, map, kakao } = useKakaoMap();
    const { user } = useAuthStore();
    const guestId = localStorage.getItem(GUEST_KEY);

    const { themes = [], priority = '', budget = null, duration = null, trafficOption, budgetAmount } = useTripStore();
    const { location, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();

    const [customCenter, setCustomCenter] = useState(null);
    const [activeLocation, setActiveLocation] = useState(null);
    const [farDestination, setFarDestination] = useState(null);
    const [keyword, setKeyword] = useState("");

    // ✅ Category State
    const [activeCategory, setActiveCategory] = useState(() => {
        if (themes.includes('food')) return 'food';
        if (themes.includes('activity')) return 'activity';
        return 'healing';
    });

    const STORAGE_KEY = `traffic_recommendation_${trafficOption}`;

    const recommendRandomCity = (currentLoc) => {
        console.log("🎲 Generating New Recommendation...");
        let candidates = [];
        let selected = null;

        if (trafficOption === 'far') {
            candidates = Object.entries(KOREA_CITY_COORDS)
                .map(([name, coords]) => ({ name, ...coords, dist: haversineKm(currentLoc, coords) }))
                .filter(city => city.dist >= 100);

            if (candidates.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidates.length);
                selected = candidates[randomIndex];
            } else {
                selected = { name: '부산', lat: 35.1796, lng: 129.0756 };
            }
            setFarDestination(selected);

        } else if (trafficOption === 'near') {
            candidates = Object.entries(KOREA_CITY_COORDS)
                .map(([name, coords]) => ({ name, ...coords, dist: haversineKm(currentLoc, coords) }))
                .filter(city => city.dist > 5 && city.dist < 100);

            if (candidates.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidates.length);
                selected = candidates[randomIndex];
                toast.success(`오늘은 가볍게 '${selected.name}' 근교로 떠나볼까요? 🚗`, { icon: '🏙️' });
            } else {
                selected = { ...currentLoc, name: '현재 위치 주변' };
            }
        } else {
            selected = { ...currentLoc, name: '현재 위치 주변' };
        }

        console.log("✅ Selected:", selected);
        setActiveLocation(selected);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    };

    useEffect(() => {
        if (!location) {
            if (!activeLocation && !geoLoading && geoError) {
                setActiveLocation({ lat: 37.5665, lng: 126.9780 });
            }
            return;
        }

        if (activeLocation) return;

        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setActiveLocation(parsed);
                if (trafficOption === 'far') setFarDestination(parsed);
                return;
            } catch (e) {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }

        recommendRandomCity(location);

    }, [location, trafficOption, activeLocation, geoLoading, geoError]);

    const handleReroll = () => {
        if (!location) {
            toast.error("위치 정보를 기다리는 중입니다.");
            return;
        }
        setActiveLocation(null);
        sessionStorage.removeItem(STORAGE_KEY);
        toast.success("새로운 지역을 찾아보는 중... 🎲");
    };

    const searchCenter = customCenter || activeLocation || { lat: 37.5665, lng: 126.9780 };

    useEffect(() => {
        if (trafficOption === 'far' && farDestination) {
            toast.success(`일상에서 벗어나 '${farDestination.name}'(으)로 떠나보세요! ✈️`, { icon: '🏙️', duration: 4000 });
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
                if (!courseItems || courseItems.length === 0) return;
                const style = COURSE_STYLES[courseIdx % 3];
                courseItems.forEach((item, index) => {
                    if (!item.mapy || !item.mapx) return;
                    const content = document.createElement('div');
                    content.className = `custom-overlay-marker`;
                    content.innerHTML = `<span class="marker-number">${index + 1}</span>`;
                    content.style.cssText = `
                width: 28px; height: 28px; background-color: ${style.color}; color: white; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3); cursor: pointer; border: 2px solid white;
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
            if (rankedItems?.[0]?.[0]) {
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
                toast.success("새로운 지역에서 코스를 찾습니다!");
            } else { toast.error("장소를 찾을 수 없습니다."); }
        });
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

    const [selected, setSelected] = useState(null);
    const [nights, setNights] = useState(1);
    const [people, setPeople] = useState(2);
    const [planText, setPlanText] = useState("");
    const [diffResult, setDiffResult] = useState(null);

    const openDetail = (item) => {
        setSelected(item); setNights(1); setPeople(2); setPlanText(""); setDiffResult(null);
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
            heroImage: courseItems[0]?.firstimage || courseItems[0]?.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
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
            planText: courseItems.map((it, i) => `${i + 1}. ${it.title} (${estimateBudgetLevel(it).label})`).join('\n')
        };

        try {
            await addPlan({ ...payload, category: "traffic" });
            toast.success(`'${courseTitle}'가 전체 저장되었습니다! 📂`);
        } catch (e) {
            console.error(e);
            toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="pageWrap">
            {/* Bio Weather Banner */}
            {bioMatch && (
                <div style={{ margin: '0 auto 16px', maxWidth: '600px', background: `linear-gradient(90deg, #333, ${bioMatch.color}40)`, padding: '12px 20px', borderRadius: '30px', border: `1px solid ${bioMatch.color}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🌡️</span>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#ccc' }}>바이오리듬 날씨 매칭</div>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{bioMatch.msg}</div>
                    </div>
                </div>
            )}

            <div className="pageDesc" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', minHeight: '20px' }}>
                {geoLoading && <span style={{ color: '#666' }}>📡 GPS 수신 중... (기본: 서울)</span>}
                {geoError && (
                    <>
                        <span style={{ color: '#d9534f' }}>⚠️ 위치 권한 필요 (현재: 서울 기준).</span>
                        <button onClick={requestLocation} style={{ padding: '4px 8px', borderRadius: '4px', background: '#333', color: '#fff' }}>권한 요청</button>
                    </>
                )}
            </div>

            {trafficOption && (
                <div style={{ textAlign: 'center', marginBottom: '16px', color: '#333' }}>
                    선택하신 테마: <b style={{ color: '#e67e22' }}>{trafficOption === 'near' ? '🏙️ 근교 드라이브' : '✈️ 멀리 떠나기'}</b>
                    {activeLocation && trafficOption === 'far' && <span style={{ marginLeft: 8 }}>👉 {activeLocation.name}</span>}
                    <button
                        onClick={handleReroll}
                        style={{
                            marginLeft: '12px',
                            padding: '4px 10px',
                            fontSize: '0.8rem',
                            borderRadius: '20px',
                            border: '1px solid #ccc',
                            background: '#f8f9fa',
                            color: '#333',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e9ecef'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                        🔄 다른 지역 추천받기
                    </button>
                </div>
            )}

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
                        {cat === 'activity' ? '🚗 액티비티' : cat === 'food' ? '🍽️ 맛집' : '🌿 힐링'}
                    </button>
                ))}
            </div>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <div id="map" ref={mapRef} className="mapContainer"></div>
                <WeatherWidget lat={searchCenter.lat} lon={searchCenter.lng} absolute={true} />
            </div>

            <div className="searchContainer">
                <input type="text" placeholder="지역 검색 (예: 제주도, 강릉)" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown} className="searchInput" />
                <button onClick={handleSearch} className="searchBtn" style={{ background: '#3b82f6' }}>검색</button>
            </div>

            {distanceKm !== null && distanceKm > 1 && (
                <div style={{ textAlign: 'center', marginBottom: '24px', color: '#bdbdbd', fontSize: '0.95rem' }}>
                    📍 내 위치에서 약 <b style={{ color: '#333' }}>{Math.round(distanceKm)}km</b> 떨어져 있어요.
                </div>
            )}

            <div className="coursesContainer" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div style={{ padding: '20px 0 0' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 6px', color: '#1a1a1a' }}>
                        ✨ {user?.email ? user.email.split('@')[0] : (guestId ? `비회원${guestId.slice(0, 4)}` : '여행러')}님을 위한 추천
                    </h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>AI가 분석한 맞춤형 드라이브 코스예요!</p>
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
                                    <span>코스 {courseIdx + 1}</span>
                                    <span style={{ width: '1px', height: '12px', background: '#ddd' }}></span>
                                    <span>약 {estimatedCost.toLocaleString()}원</span>
                                </div>
                            </div>

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
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handleSaveCourse(courseItems, `드라이브 코스 ${courseIdx + 1}`)}
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

            <TripDetailDrawer open={!!selected} onClose={() => setSelected(null)} item={selected} nights={nights} setNights={setNights} people={people} setPeople={setPeople} planText={planText} setPlanText={setPlanText} diffResult={diffResult} onImprove={handleImprove} onSave={async (payload) => { await addPlan({ ...payload, category: "traffic" }); toast.success("플랜이 저장됐어요!"); setSelected(null); }} improveLabel="AI 자동 보완" />
        </div>
    );
}