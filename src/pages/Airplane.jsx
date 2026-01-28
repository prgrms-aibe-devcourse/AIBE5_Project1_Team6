import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";
import OSMMap from "../components/OSMMap";
import { searchCountryData } from "../services/foreignAffairs";
import { fetchCurrentWeatherByLatLon, clothingTip, compareWithKorea, getWeatherLabel } from "../services/weather";
import { getCountryRecommendations } from "../services/recommendations";
import RecommendationCard from "../components/RecommendationCard";
import WeatherWidget from "../components/WeatherWidget";
import { createNotification } from "../services/mypageService";
import "./Walk.css"; // Import Walk.css for searchContainer styles
import { savePlace, isPlaceSaved, getSavedPlaces, deletePlace } from "../services/savedPlacesService";
import Skeleton from "../components/common/Skeleton";
import LoadingOverlay from "../components/LoadingOverlay";
import "../styles/cards.css";
import toast from "react-hot-toast";
import { addSchedule } from "../services/schedulesStorage";

/// Travel Warning Levels
// 1: Blue (Attention), 2: Yellow (Caution), 3: Red (Restrain), 4: Black (Ban)
const getWarningLevel = (warningData) => {
    if (!warningData) {
        return {
            level: -1,
            color: "#9ca3af", // gray-400
            text: "정보 없음",
            desc: "외교부 경보 데이터를 찾지 못했습니다.",
            textColor: "#fff",
        };
    }

    const lvlRaw = warningData.alarm_lvl ?? warningData.alarmLvl ?? warningData.level ?? 0;
    const lvl = parseInt(lvlRaw, 10) || 0;

    switch (lvl) {
        case 1:
            return { level: 1, color: "#2979ff", text: "여행유의 (1단계)", desc: "신변안전에 유의하세요." };
        case 2:
            return { level: 2, color: "#facc15", text: "여행자제 (2단계)", desc: "여행 필요성을 신중히 검토하세요." };
        case 3:
            return { level: 3, color: "#f87171", text: "출국권고 (3단계)", desc: "긴급용무가 아니면 철수하고, 여행은 취소/연기하세요." };
        case 4:
            return { level: 4, color: "#000000", text: "여행금지 (4단계)", desc: "즉시 대피/철수하고, 여행이 금지됩니다.", textColor: "#fff" };
        default:
            return {
                level: 0,
                color: "#4caf50",
                text: "경보 없음",
                desc: "특별한 여행경보가 발령되지 않았습니다.",
            };
    }
};

export default function Airplane() {
    const { user, setShowLoginPrompt } = useAuthStore();
    const guestId = localStorage.getItem(GUEST_KEY);

    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    // Geocoding Helper (Nominatim)
    const fetchCoords = async (query) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const json = await res.json();
            if (json && json.length > 0) return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) };
        } catch (e) {
            console.error("Geocoding failed", e);
        }
        return null;
    };

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        // Data retained for smooth transition, Skeleton overlays map
        setRecommendations([]);

        try {
            // 1. Fetch MOFA Data
            let mofaData = null;
            try {
                mofaData = await searchCountryData(keyword);
            } catch (e) {
                console.warn("MOFA Search Failed:", e);
            }

            if (!mofaData) {
                toast.error("국가를 찾을 수 없습니다. (정확한 국가명을 입력해주세요)");
                setLoading(false);
                return;
            }

            // 2. Geocoding
            const coords = await fetchCoords(mofaData.nameEn || mofaData.nameKr || keyword);

            let weatherInfo = null;
            let compareInfo = null;

            if (coords) {
                try {
                    weatherInfo = await fetchCurrentWeatherByLatLon(coords.lat, coords.lon);
                    compareInfo = await compareWithKorea(weatherInfo.temp);
                } catch (e) {
                    console.error("Weather fetch failed");
                }
            }

            setData({
                ...mofaData,
                weather: weatherInfo,
                comparison: compareInfo,
                lat: coords?.lat || 37.5665,
                lon: coords?.lon || 126.9780
            });

            // 3. Recommendations
            if (mofaData.code) {
                setRecommendations(getCountryRecommendations(mofaData.code));
            }

        } catch (e) {
            toast.error("정보를 불러오는 중 오류가 발생했습니다.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

    const [likedTitles, setLikedTitles] = useState(new Set());
    const [registeredTitles, setRegisteredTitles] = useState(new Set());

    useEffect(() => {
        if (!user) return;
        getSavedPlaces(user.id).then(places => {
            const likes = new Set();
            const bookmarks = new Set();
            places.forEach(p => {
                const type = p.place_data?.savedType || 'like';
                if (type === 'bookmark') bookmarks.add(p.title);
                else likes.add(p.title);
            });
            setLikedTitles(likes);
            setRegisteredTitles(bookmarks);
        });
    }, [user]);

    const handleToggleLike = async (item) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        const title = item.title || item.name;

        try {
            if (likedTitles.has(title)) {
                // DELETE logic
                const places = await getSavedPlaces(user.id);
                const target = places.find(p => p.title === title && (p.place_data?.savedType || 'like') === 'like');
                
                if (target) {
                    await deletePlace(target.id);
                    setLikedTitles(prev => {
                        const next = new Set(prev);
                        next.delete(title);
                        return next;
                    });
                    toast.success("저장이 취소되었습니다.");
                }
            } else {
                // INSERT logic
                await savePlace(user.id, {
                    title: title,
                    image: item.image,
                    country: item.country || query,
                    description: item.description || item.desc,
                    tag: item.tag,
                    category: 'airplane',
                    matchScore: item.matchScore || 92,
                    ...item,
                    savedType: 'like'
                });
                
                await createNotification({
                    user_id: user.id,
                    type: 'save',
                    message: `"${title}" 좋아요 완료!`,
                    link: '/mypage'
                });

                setLikedTitles(prev => new Set([...prev, title]));
                toast.success("저장되었습니다! 마이페이지에서 확인하세요.");
            }
        } catch (e) {
            console.error(e);
            toast.error("작업 중 오류가 발생했습니다.");
        }
    };

    const handleToggleBookmark = async (item) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }

        const title = item.title || item.name;

        try {
            if (registeredTitles.has(title)) {
                // DELETE logic
                const places = await getSavedPlaces(user.id);
                const target = places.find(p => p.title === title && (p.place_data?.savedType) === 'bookmark');
                
                if (target) {
                    await deletePlace(target.id);
                    setRegisteredTitles(prev => {
                        const next = new Set(prev);
                        next.delete(title);
                        return next;
                    });
                    toast.success("여행지 등록이 취소되었습니다.");
                }
            } else {
                // INSERT logic
                // INSERT logic
                await savePlace(user.id, {
                    ...item,
                    title: title,
                    image: item.image,
                    country: item.country || query,
                    description: item.description || item.desc,
                    tag: item.tag,
                    category: 'airplane',
                    matchScore: item.matchScore || 92,
                    savedType: 'bookmark'
                });
                
                await createNotification({
                    user_id: user.id,
                    type: 'save',
                    message: `"${title}" 여행지 등록 완료!`,
                    link: '/planlab'
                });

                setRegisteredTitles(prev => new Set([...prev, title]));
                toast.success("여행지가 등록되었습니다! 일정관리에서 확인하세요.");
            }
        } catch (e) {
            console.error(e);
            toast.error("작업 중 오류가 발생했습니다.");
        }
    };



    // Render Logic
    const warningInfo = data ? getWarningLevel(data.warning) : null;

    return (
        <div className="pageWrap">
            {/* Global Loading Overlay */}
            {loading && <LoadingOverlay message="열심히 여행지 정보를 찾는 중이에요!" icon="✈️" />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* 1. Dynamic Layout: Map & Basic Info */}
                {/* Responsive Grid handling via CSS recommended, but using simple media check logic here or keeping usage simple */}
                {/* 1. Dynamic Layout: Map with Overlay Info */}
                <div className="airplane-layout" style={{ position: 'relative' }}>

                    {/* Full Width Map Container (With Conditional Empty State) */}
                    {(data || loading) ? (
                        <div style={{ position: 'relative', width: "100%", height: "450px", borderRadius: "24px", overflow: "hidden", border: '1px solid rgba(0,0,0,0.08)', boxShadow: 'var(--shadow-md)' }}>
                            {/* Map Component */}
                            <OSMMap
                                lat={data?.lat || 37.5665}
                                lon={data?.lon || 126.9780}
                                title={data?.nameKr || "대한민국"}
                                zoom={data ? 5 : 6}
                                style={{ height: '100%', marginTop: 0 }}
                                showMarker={!!data}
                            />

                            {/* ⚠️ Warning Overlay (Bottom Left) */}
                            {!loading && data && warningInfo && (
                                <div
                                    className="warning-badge-container"
                                    style={{
                                        position: 'absolute', bottom: '24px', left: '24px', zIndex: 1000,
                                        display: 'flex', alignItems: 'center', cursor: 'help'
                                    }}
                                >
                                    {/* Hover Tooltip */}
                                    <div className="warning-tooltip" style={{
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        padding: '8px 16px', borderRadius: '12px',
                                        border: `2px solid ${warningInfo.color}`,
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                        display: 'flex', flexDirection: 'column',
                                        marginRight: '12px', opacity: 0, transform: 'translateX(-10px)',
                                        transition: 'all 0.3s ease', pointerEvents: 'none', position: 'absolute',
                                        left: '46px', bottom: '0', width: 'max-content'
                                    }}>
                                        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>여행 경보</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#333' }}>{warningInfo.text}</span>
                                    </div>

                                    {/* Icon */}
                                    <div style={{
                                        background: warningInfo.color, color: '#fff',
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.5rem',
                                        boxShadow: 'var(--shadow-lg)', transition: 'transform 0.2s', zIndex: 2
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.parentElement.querySelector('.warning-tooltip').style.opacity = '1';
                                            e.currentTarget.parentElement.querySelector('.warning-tooltip').style.transform = 'translateX(0)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.parentElement.querySelector('.warning-tooltip').style.opacity = '0';
                                            e.currentTarget.parentElement.querySelector('.warning-tooltip').style.transform = 'translateX(-10px)';
                                        }}
                                    >!</div>
                                </div>
                            )}

                            {/* ⛅ Weather Overlay (Top Right) */}
                            {!loading && data && (
                                <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 500 }}>
                                    <WeatherWidget
                                        lat={data.lat}
                                        lon={data.lon}
                                        absolute={true}
                                        comparisonText={data.comparison}
                                    />
                                </div>
                            )}

                            {/* ℹ️ Basic Info Overlay (Bottom Right) - Hover Tooltip Style */}
                            {(data || loading) && (
                                <div
                                    className="basic-info-container"
                                    style={{
                                        position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000,
                                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', cursor: 'help'
                                    }}
                                >
                                    {/* Tooltip Content (Appears on Hover) */}
                                    <div className="basic-info-tooltip" style={{
                                        background: 'rgba(255, 255, 255, 0.98)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '20px', 
                                        borderRadius: '20px',
                                        border: '2px solid #3b82f6',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                        display: 'flex', flexDirection: 'column',
                                        marginRight: '16px', 
                                        opacity: 0, 
                                        transform: 'translateX(10px)',
                                        pointerEvents: 'none', 
                                        position: 'absolute',
                                        right: '50px', 
                                        bottom: '0', 
                                        width: '280px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                        {loading ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <Skeleton width="40%" height="20px" />
                                                <Skeleton width="100%" height="20px" />
                                                <Skeleton width="100%" height="20px" />
                                            </div>
                                        ) : (
                                            <>
                                                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: '#1e293b', display:'flex', alignItems:'center', gap:'6px' }}>
                                                    <span>ℹ️ 국가 기본 정보</span>
                                                </h3>
                                                {data.basic ? (
                                                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                                                        <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                                            <span style={{ color: '#64748b' }}>수도</span>
                                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{data.basic.capital || '-'}</span>
                                                        </li>
                                                        <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                                            <span style={{ color: '#64748b' }}>화폐</span>
                                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{data.basic.currency || '-'}</span>
                                                        </li>
                                                        <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                                            <span style={{ color: '#64748b' }}>언어</span>
                                                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{data.basic.lang || '-'}</span>
                                                        </li>
                                                        <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#64748b' }}>종교</span>
                                                            <span style={{ fontWeight: 700, color: '#0f172a', textAlign:'right', maxWidth:'60%' }}>{data.basic.religion || '-'}</span>
                                                        </li>
                                                    </ul>
                                                ) : (
                                                    <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>정보가 없습니다.</div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Trigger Icon */}
                                    <div style={{
                                        background: '#3b82f6', 
                                        color: '#fff',
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1.5rem', fontFamily: 'serif',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', 
                                        transition: 'transform 0.2s', zIndex: 1001,
                                        border: '2px solid #fff'
                                    }}
                                        onMouseEnter={(e) => {
                                            const tooltip = e.currentTarget.parentElement.querySelector('.basic-info-tooltip');
                                            if(tooltip) {
                                                tooltip.style.opacity = '1';
                                                tooltip.style.transform = 'translateX(0)';
                                                tooltip.style.pointerEvents = 'auto'; // allow interaction if needed, though strictly hover
                                            }
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            const tooltip = e.currentTarget.parentElement.querySelector('.basic-info-tooltip');
                                            if(tooltip) {
                                                tooltip.style.opacity = '0';
                                                tooltip.style.transform = 'translateX(10px)';
                                                tooltip.style.pointerEvents = 'none';
                                            }
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    >
                                        i
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Empty State (Initial View) - Replaces Map
                        <div style={{
                            width: "100%", height: "450px", // Same size as map
                            borderRadius: "24px",
                            background: 'white',
                            boxShadow: 'var(--shadow-md)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', padding: '40px'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌏</div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>여행의 시작, 어디가 좋을까요?</h3>
                            <p style={{ color: 'var(--text-sub)', lineHeight: '1.6' }}>
                                원하시는 <strong>국가명</strong>을 검색해보세요.<br />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>날씨, 안전 정보, 추천 여행지까지 한 번에 알려드려요.</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Search Bar - Below Map */}
                <div className="searchContainer" style={{ marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="어디로 떠나볼까요? 제주/국가를 입력해주세요."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={onKeyDown}
                        className="searchInput"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="searchBtn"
                    >
                        {loading ? '...' : '검색'}
                    </button>
                </div>

                {/* Detailed Content */}
                {data && !loading && (
                    <>
                        <div className="grid">
                            {warningInfo?.level >= 3 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#ef4444', fontWeight: 'bold', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '20px' }}>
                                    ⛔ 여행 위험 국가입니다.<br />
                                    추천 여행지 정보 제공이 제한됩니다.
                                </div>
                            )}
                        </div>

                        {/* Recommendation Section */}
                        {warningInfo?.level < 3 && recommendations.length > 0 && (
                            <div style={{ marginTop: '0px' }}>
                                <div style={{ padding: '0 0 20px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0', color: 'var(--text-main)' }}>
                                        ✨ {data.nameKr} 추천 여행지
                                    </h3>
                                </div>
  
                                <div className="grid" style={{ paddingTop: '10px' }}>
                                    {recommendations.map((item, idx) => {
                                        // Creating pseudo-random images based on index
                                        const images = [
                                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                                            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
                                            "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?auto=format&fit=crop&w=800&q=80",
                                            "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80"
                                        ];
                                        const matchScore = 85 + (idx * 3);
                                        const cardImage = item.image || images[idx % images.length];
                                        const cardColor = ['#DC3232', '#1E64F0', '#14A050'][idx % 3];
                                        return (
                                            <div 
                                                key={item.id || idx}
                                                style={{ 
                                                    cursor: "pointer",
                                                    borderRadius: '16px',
                                                    border: '2px solid transparent',
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = cardColor;
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = `0 10px 20px -5px ${cardColor}40`;
                                                    e.currentTarget.style.zIndex = '10';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = 'transparent';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.zIndex = '1';
                                                }}
                                            >
                                                <RecommendationCard
                                                    title={item.title}
                                                    country={data.nameKr}
                                                    tag={item.category}
                                                    desc={item.desc}
                                                    image={cardImage}
                                                    matchScore={matchScore > 99 ? 99 : matchScore}
                                                    showMatchScore={false}
                                                    onLike={() => handleToggleLike({ 
                                                        ...item, 
                                                        image: cardImage, 
                                                        country: data.nameKr,
                                                        matchScore: matchScore > 99 ? 99 : matchScore
                                                    })}
                                                    onSave={() => handleToggleBookmark({ 
                                                        ...item, 
                                                        image: cardImage, 
                                                        country: data.nameKr,
                                                        matchScore: matchScore > 99 ? 99 : matchScore
                                                    })}
                                                    isLiked={likedTitles.has(item.title || item.name)}
                                                    isRegistered={registeredTitles.has(item.title || item.name)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}



            </div>
        </div>
    );
}