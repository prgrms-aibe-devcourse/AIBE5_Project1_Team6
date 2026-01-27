import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";
import OSMMap from "../components/OSMMap";
import { searchCountryData } from "../services/foreignAffairs";
import { fetchCurrentWeatherByLatLon, clothingTip, compareWithKorea, getWeatherLabel } from "../services/weather";
import { getCountryRecommendations } from "../services/recommendations"; 
import RecommendationCard from "../components/RecommendationCard";
import WeatherWidget from "../components/WeatherWidget";
import Skeleton from "../components/common/Skeleton"; // Import Skeleton
import "../styles/cards.css";
import toast from "react-hot-toast";

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
  const { user } = useAuthStore();
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
          if(mofaData.code) {
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

  // Render Logic
  const warningInfo = data ? getWarningLevel(data.warning) : null;

  return (
    <div className="pageWrap">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Dynamic Layout: Map & Basic Info */}
          {/* Responsive Grid handling via CSS recommended, but using simple media check logic here or keeping usage simple */}
          <div className="airplane-layout" style={{ 
              display: 'grid', 
              gridTemplateColumns: (data || loading) ? '1.2fr 0.8fr' : '1fr', 
              gap: '20px', 
              alignItems: 'stretch',
              transition: 'all 0.5s ease'
          }}>
              
              {/* Left: Map */}
              <div style={{ position: 'relative', width: "100%", height: "320px", borderRadius: "20px", overflow: "hidden", border: '1px solid rgba(0,0,0,0.08)', boxShadow: 'var(--shadow-md)' }}>
                 {/* Map Component */}
                 <OSMMap 
                    lat={data?.lat || 37.5665} 
                    lon={data?.lon || 126.9780} 
                    title={data?.nameKr || "대한민국"} 
                    zoom={data ? 5 : 6} 
                    style={{ height: '100%' }} 
                    showMarker={!!data}
                 />
                 
                 {/* Loading Mask (Glassmorphism) */}
                 {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 1100,
                        background: 'rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ 
                            padding: '12px 24px', background: 'white', borderRadius: '30px', 
                            boxShadow: 'var(--shadow-lg)', fontWeight: 'bold', color: 'var(--primary)' 
                        }}>
                             ✈️ 비행 중...
                        </div>
                    </div>
                 )}

                 {/* ⚠️ Warning Overlay (Bottom Left) */}
                 {!loading && data && warningInfo && (
                     <div 
                        className="warning-badge-container"
                        style={{
                            position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000,
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
                             width: '40px', height: '40px', borderRadius: '50%', 
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             fontWeight: 'bold', fontSize: '1.4rem',
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
                     <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 1000 }}>
                        <WeatherWidget 
                            lat={data.lat} 
                            lon={data.lon} 
                            absolute={true} 
                            comparisonText={data.comparison} 
                        />
                     </div>
                 )}
              </div>

              {/* Right: Basic Info (Skeleton or Data) */}
              {(data || loading) && (
                  <div style={{ 
                      background: '#fff', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', 
                      padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                  }}>
                       {loading ? (
                           // Skeleton UI
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                               <Skeleton width="40%" height="24px" />
                               <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                   <Skeleton width="100%" height="40px" />
                                   <Skeleton width="100%" height="40px" />
                                   <Skeleton width="100%" height="40px" />
                               </div>
                           </div>
                       ) : (
                           // Real Data
                           <>
                               <h3 className="card-title" style={{ marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   ℹ️ <span style={{ borderBottom: '2px solid var(--primary-light)' }}>국가 기본 정보</span>
                               </h3>
                               {data.basic ? (
                                   <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.95rem' }}>
                                       <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f9fafb', paddingBottom: '12px' }}>
                                           <span style={{ color: 'var(--text-sub)' }}>수도</span>
                                           <span style={{ fontWeight: 700 }}>{data.basic.capital || '-'}</span>
                                       </li>
                                       <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f9fafb', paddingBottom: '12px' }}>
                                           <span style={{ color: 'var(--text-sub)' }}>화폐</span>
                                           <span style={{ fontWeight: 700 }}>{data.basic.currency || '-'}</span>
                                       </li>
                                       <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f9fafb', paddingBottom: '12px' }}>
                                           <span style={{ color: 'var(--text-sub)' }}>언어</span>
                                           <span style={{ fontWeight: 700 }}>{data.basic.lang || '-'}</span>
                                       </li>
                                       <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                                           <span style={{ color: 'var(--text-sub)' }}>종교</span>
                                           <span style={{ fontWeight: 700 }}>{data.basic.religion || '-'}</span>
                                       </li>
                                   </ul>
                               ) : (
                                   <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                       기본 정보가 없습니다.
                                   </div>
                               )}
                           </>
                       )}
                  </div>
              )}
          </div>

          {/* 🔍 Search Container */}
          <div className="searchContainer" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
              <input
                  type="text"
                  placeholder="어디로 떠나볼까요? (예: 파리, 방콕, 뉴욕)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="searchInput"
                  style={{ 
                      boxShadow: 'var(--shadow-md)', 
                      border: '1px solid rgba(0,0,0,0.05)',
                      padding: '16px 24px', fontSize: '1.05rem', borderRadius: '50px' 
                  }}
              />
              <button 
                onClick={handleSearch} 
                className="searchBtn" 
                disabled={loading} 
                style={{ 
                    backgroundColor: '#3b82f6', 
                    color: '#ffffff',
                    borderRadius: '50px',
                    padding: '0 28px',
                    boxShadow: 'var(--shadow-md)',
                    border: 'none',
                    fontWeight: 'bold'
                }}
              >
                     {loading ? "..." : "검색"}
              </button>
          </div>

          {/* Detailed Content */}
          {data && !loading && (
            <>
               <div className="grid">
                   {warningInfo?.level >= 3 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#ef4444', fontWeight: 'bold', background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '20px' }}>
                            ⛔ 여행 위험 국가입니다.<br/>
                            추천 여행지 정보 제공이 제한됩니다.
                        </div>
                   )}
               </div>
                
               {/* Recommendation Section */}
               {warningInfo?.level < 3 && recommendations.length > 0 && (
                 <div style={{ marginTop: '40px' }}>
                    <div style={{ padding: '0 0 20px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0', color: 'var(--text-main)' }}>
                           ✨ {data.nameKr} 추천 여행지
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>AI가 엄선한 힐링 & 웰니스 스팟</p>
                    </div>

                    <div className="grid">
                      {recommendations.map((item, idx) => {
                        // Creating pseudo-random images based on index
                        const images = [
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1499856871940-a09627c6d7db?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80"
                        ];
                        const matchScore = 85 + (idx * 3);
                        return (
                             <div key={item.id || idx}>
                                <RecommendationCard 
                                    title={item.title}
                                    country={data.nameKr}
                                    tag={item.category}
                                    desc={item.desc}
                                    image={images[idx % images.length]}
                                    matchScore={matchScore > 99 ? 99 : matchScore}
                                />
                             </div>
                        );
                      })}
                    </div>
                 </div>
               )}
            </>
          )}

          {/* Empty State (Friendly) */}
          {!data && !loading && (
              <div style={{ 
                  textAlign: 'center', marginTop: '60px', padding: '40px',
                  background: 'white', borderRadius: '24px', boxShadow: 'var(--shadow-sm)',
                  border: '1px solid rgba(0,0,0,0.03)'
              }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌏</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)' }}>여행의 시작, 어디가 좋을까요?</h3>
                  <p style={{ color: 'var(--text-sub)', lineHeight: '1.6' }}>
                      원하시는 <strong>국가명</strong>을 검색해보세요.<br/>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>날씨, 안전 정보, 추천 여행지까지 한 번에 알려드려요.</span>
                  </p>
              </div>
          )}

      </div>
    </div>
  );
}