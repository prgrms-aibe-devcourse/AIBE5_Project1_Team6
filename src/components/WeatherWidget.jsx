import { useEffect, useState } from 'react';
import { fetchCurrentWeatherByLatLon, clothingTip, getWeatherLabel } from '../services/weather';

export default function WeatherWidget({ lat, lon }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '12px', margin: '20px auto', maxWidth: '600px', color: '#888' }}>
                ⛅ 현지 날씨 정보를 불러오는 중...
            </div>
        );
    }

    if (!weather) return null;

    const tip = clothingTip(weather.temp, weather.code);
    const label = getWeatherLabel(weather.code);

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)', 
            borderRadius: '16px', 
            padding: '20px', 
            margin: '24px auto', 
            maxWidth: '800px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid #d1edf2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '2.5rem' }}>
                    {label.includes('맑음') ? '☀️' : label.includes('비') ? '☔' : label.includes('눈') ? '☃️' : '☁️'}
                </div>
                <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                        현재 기온 <span style={{ color: '#00bcd4' }}>{weather.temp}°C</span> ({label})
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                        바람: {weather.wind} km/h
                    </div>
                </div>
            </div>

            <div style={{ 
                flex: 1, 
                minWidth: '200px',
                background: 'rgba(255,255,255,0.7)', 
                padding: '12px 16px', 
                borderRadius: '8px',
                borderLeft: '4px solid #00acc1',
                fontSize: '0.95rem',
                color: '#444',
                lineHeight: '1.5'
            }}>
                <b>💡 오늘의 팁:</b> {tip}
            </div>
            
            {/* Weekly Forecast */}
            {weather.daily && (
                <div style={{ width: '100%', marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '16px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {weather.daily.time.map((date, idx) => {
                        const dayLabel = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
                        const code = weather.daily.code[idx];
                        const label = getWeatherLabel(code);
                        const icon = label.includes('맑음') ? '☀️' : label.includes('비') ? '☔' : label.includes('눈') ? '☃️' : '☁️';
                        
                        return (
                           <div key={idx} style={{ 
                               flex: '0 0 auto', 
                               textAlign: 'center', 
                               minWidth: '60px', 
                               background: 'rgba(255,255,255,0.5)', 
                               padding: '8px', 
                               borderRadius: '8px',
                               fontSize: '0.85rem'
                           }}>
                               <div style={{ color: '#888', marginBottom: '4px' }}>{dayLabel}</div>
                               <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{icon}</div>
                               <div style={{ fontWeight: 'bold', color: '#333' }}>{Math.round(weather.daily.max[idx])}°</div>
                               <div style={{ color: '#aaa', fontSize: '0.8rem' }}>{Math.round(weather.daily.min[idx])}°</div>
                           </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
