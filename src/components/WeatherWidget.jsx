import { useEffect, useState } from 'react';
import { fetchCurrentWeatherByLatLon, clothingTip, getWeatherLabel } from '../services/weather';

export default function WeatherWidget({ lat, lon, absolute = false, comparisonText }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!lat || !lon) return;

        setLoading(true);
        fetchCurrentWeatherByLatLon(lat, lon)
            .then(data => {
                setWeather(data);
            })
            .catch(err => {
                console.error("Weather Load Error", err);
            })
            .finally(() => setLoading(false));
    }, [lat, lon]);

    if (!lat || !lon) return null;

    if (loading) return null;
    if (!weather) return null;

    const tip = clothingTip(weather.temp, weather.code);
    const label = getWeatherLabel(weather.code);
    const mainIcon = label.includes('맑음') ? '☀️' : label.includes('비') ? '☔' : label.includes('눈') ? '☃️' : '☁️';

    return (
        <div 
            style={{ 
                position: absolute ? 'absolute' : 'relative',
                top: absolute ? '20px' : 'auto',
                right: absolute ? '20px' : 'auto',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Compact Header (Always Visible) */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '50px',
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            }}>
                <span style={{ fontSize: '1.4rem' }}>{mainIcon}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#333' }}>{weather.temp}°C</span>
            </div>

            {/* Expanded Content (Hover Only) */}
            <div style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '16px',
                padding: '16px',
                width: '280px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                border: '1px solid #f0f0f0',
                opacity: isHovered ? 1 : 0,
                visibility: isHovered ? 'visible' : 'hidden',
                transform: isHovered ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                pointerEvents: isHovered ? 'auto' : 'none',
            }}>
                {/* Info Text */}
                <div style={{ marginBottom: '12px' }}>
                     <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                         {label}, 풍속 {weather.wind} km/h
                     </div>
                     <div style={{ 
                        background: '#f0f7ff', 
                        color: '#2563eb', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        lineHeight: '1.4'
                     }}>
                        💡 {tip}
                     </div>
                     {comparisonText && (
                        <div style={{ 
                            marginTop: '8px', 
                            fontSize: '0.85rem', 
                            color: '#e03131', 
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                             🇰🇷 {comparisonText}
                        </div>
                     )}
                 </div>

                 {/* Weekly Forecast */}
                 {weather.daily && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '4px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #eee'
                    }}>
                        {weather.daily.time.slice(0, 5).map((date, idx) => {
                            const dayLabel = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
                            const code = weather.daily.code[idx];
                            const lbl = getWeatherLabel(code);
                            const icon = lbl.includes('맑음') ? '☀️' : lbl.includes('비') ? '☔' : lbl.includes('눈') ? '☃️' : '☁️';
                            
                            return (
                               <div key={idx} style={{ textAlign: 'center', fontSize: '0.7rem' }}>
                                   <div style={{ color: '#888', marginBottom: '2px' }}>{dayLabel}</div>
                                   <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{icon}</div>
                                   <div style={{ fontWeight: 'bold', color: '#333' }}>{Math.round(weather.daily.max[idx])}°</div>
                               </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

