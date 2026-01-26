import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { GUEST_KEY } from "../utils/guestUtils";
import OSMMap from "../components/OSMMap";
import { searchCountryData } from "../services/foreignAffairs";
import { fetchCurrentWeatherByLatLon, clothingTip, compareWithKorea, getWeatherLabel } from "../services/weather";
import { getCountryRecommendations } from "../services/recommendations"; 
import "../styles/cards.css";
import toast from "react-hot-toast";

/// Travel Warning Levels
// 1: Blue (Attention), 2: Yellow (Caution), 3: Red (Restrain), 4: Black (Ban)
const getWarningLevel = (warningData) => {
  // ✅ null/undefined => 안전이 아니라 "정보 없음"
  if (!warningData) {
    return {
      level: -1,
      color: "#9e9e9e",
      text: "정보 없음",
      desc: "외교부 경보 데이터를 찾지 못했습니다. (데이터 누락 또는 매칭 실패 가능)",
      textColor: "#fff",
    };
  }

  // ✅ 어떤 응답은 alarm_lvl이 없고 ban_yn / attention 같은 플래그로만 존재할 수도 있어 방어
  const lvlRaw = warningData.alarm_lvl ?? warningData.alarmLvl ?? warningData.level ?? 0;
  const lvl = parseInt(lvlRaw, 10) || 0;

  switch (lvl) {
    case 1:
      return { level: 1, color: "#2979ff", text: "여행유의 (1단계)", desc: "신변안전에 유의하세요." };
    case 2:
      return { level: 2, color: "#ffea00", text: "여행자제 (2단계)", desc: "여행 필요성을 신중히 검토하세요." };
    case 3:
      return { level: 3, color: "#f44336", text: "출국권고 (3단계)", desc: "긴급용무가 아니면 철수하고, 여행은 취소/연기하세요." };
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
  const [data, setData] = useState(null); // { country, warning, basic, weather, comparison, lat, lon }
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
      return null; // Fallback
  };

  const handleSearch = async () => {
      if (!keyword.trim()) return;
      setLoading(true);
      setData(null);
      setRecommendations([]);

      try {
          // 1. Fetch MOFA Data (Code, Warning, Basic)
          // Note: This might throw if country not found
          let mofaData = null;
          try {
             mofaData = await searchCountryData(keyword);
          } catch (e) {
             console.warn("MOFA Search Failed:", e); 
             // If MOFA fails, we proceed with just Geocoding? 
             // The user specifically wants MOFA data. We should probably error or show partial.
             // Let's try to infer Country from Geocoder if MOFA fails by name?
          }

          if (!mofaData) {
              toast.error("외교부 데이터에서 국가를 찾을 수 없습니다. (정확한 국가명을 입력해주세요)");
              setLoading(false);
              return;
          }

          // 2. Geocoding (for Map & Weather)
          // Search using English Name for better global coverage in Nominatim
          const coords = await fetchCoords(mofaData.nameEn || mofaData.nameKr || keyword);
          
          let weatherInfo = null;
          let compareInfo = null;

          if (coords) {
              // 3. Weather & Comparison
              // We use Open-Meteo for foreign weather
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
              lat: coords?.lat || 20, // Default world view
              lon: coords?.lon || 0
          });

          // 4. Fetch Recommendations (Local Mock)
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
  const season = data?.weather?.temp > 20 ? '여름' : data?.weather?.temp < 10 ? '겨울' : '봄/가을';

  return (
    <div className="pageWrap">
      <h2 className="pageTitle">Airplane · 해외 안전 여행</h2>
      
      {/* Search */}
      <div className="searchContainer" style={{ maxWidth: '600px', margin: '20px auto' }}>
          <input
              type="text"
              placeholder="국가명을 입력하세요 (예: 가나, 일본, 프랑스)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={onKeyDown}
              className="searchInput"
          />
          <button onClick={handleSearch} className="searchBtn" disabled={loading}>
             {loading ? "분석 중..." : "검색"}
          </button>
      </div>

      {/* Result Dashboard */}
      {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Map */}
              <div style={{ width: "100%", height: "400px", borderRadius: "16px", overflow: "hidden", border: '1px solid #333' }}>
                 <OSMMap lat={data.lat} lon={data.lon} title={data.nameKr} zoom={5} style={{ height: '100%' }} />
              </div>

               {/* 2. Safety Card */}
               <div style={{ 
                   background: warningInfo.color, 
                   color: warningInfo.textColor || '#000', 
                   padding: '24px', 
                   borderRadius: '16px',
                   boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                   textAlign: 'center'
               }}>
                   <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>☢️ 여행 경보 단계</div>
                   <div style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px' }}>{warningInfo.text}</div>
                   <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>{warningInfo.desc}</div>
                   {data.warning && data.warning.remark && (
                       <div style={{ marginTop: '12px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.3)', padding: '8px', borderRadius: '8px' }}>
                           📝 비고: {data.warning.remark}
                       </div>
                   )}
               </div>

               <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                   {warningInfo.level < 3 && ( // 3단계(철수권고) 이상이면 날씨/기본정보 등 숨김
                       <>
                           {/* 3. Weather Card */}
                           <div className="feature-card" style={{ cursor: 'default' }}>
                               <div className="card-body">
                                   <h3 className="card-title">🌤️ 현지 날씨 ({season})</h3>
                                   {data.weather ? (
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                           <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                               {Math.round(data.weather.temp)}°C 
                                               <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#888', marginLeft: '8px' }}>
                                                   {getWeatherLabel(data.weather.code)}
                                               </span>
                                           </div>
                                           {data.comparison && (
                                               <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                                                   🇰🇷 {data.comparison}
                                               </div>
                                           )}
                                           <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px', background: '#f5f5f5', padding: '8px', borderRadius: '8px' }}>
                                               👕 {clothingTip(data.weather.temp, data.weather.code)}
                                           </div>
                                       </div>
                                   ) : (
                                       <div style={{ color: '#aaa' }}>날씨 정보를 가져올 수 없습니다.</div>
                                   )}
                               </div>
                           </div>

                           {/* 4. Basic Info Card (Currency included here) */}
                           <div className="feature-card" style={{ cursor: 'default' }}>
                               <div className="card-body">
                                   <h3 className="card-title">ℹ️ 국가 기본 정보</h3>
                                   {data.basic ? (
                                       <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                           {/* Note: Adjust fields based on actual API response structure */}
                                           <li><b>수도:</b> {data.basic.capital || '정보 없음'}</li>
                                           <li><b>화폐:</b> {data.basic.currency || '정보 없음'}</li>
                                           <li><b>언어:</b> {data.basic.lang || '정보 없음'}</li>
                                           <li><b>종교:</b> {data.basic.religion || '정보 없음'}</li>
                                       </ul>
                                   ) : (
                                       <div style={{ color: '#aaa' }}>기본 정보를 가져올 수 없습니다.</div>
                                   )}
                               </div>
                           </div>
                       </>
                   )}
                   {warningInfo.level >= 3 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#f44336', fontWeight: 'bold', border: '1px dashed #f44336', borderRadius: '16px' }}>
                            ⛔ 여행 위험 국가입니다.<br/>
                            날씨 및 기본 정보 제공이 제한됩니다.
                        </div>
                   )}
               </div>
                
               {/* 5. Recommendation Section (Only if Safe) */}
               {warningInfo.level < 3 && recommendations.length > 0 && (
                 <div style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 'bold' }}>✨ {data.nameKr} 추천 여행지 (Wellness)</h3>
                    <div className="scrolling-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                      {recommendations.map((item) => (
                        <div key={item.id} className="feature-card" style={{ padding: '0', overflow: 'hidden', height: '100%' }}>
                          <div style={{ height: '8px', background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)' }}></div>
                          <div style={{ padding: '16px' }}>
                             <div style={{ fontSize: '0.8rem', color: '#2575fc', fontWeight: 'bold', marginBottom: '4px' }}>{item.category}</div>
                             <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{item.title}</h4>
                             <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

          </div>
      )}

      {!data && !loading && (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
              안전한 해외여행을 위해 국가를 검색해보세요. <br/>
              외교부 최신 데이터와 날씨 정보를 제공합니다.
          </div>
      )}
    </div>
  );
}