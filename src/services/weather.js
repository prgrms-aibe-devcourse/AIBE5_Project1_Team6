// Open-Meteo: API 키 없이 사용 가능
export async function fetchCurrentWeatherByLatLon(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` + 
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();

  const current = data.current;
  const daily = data.daily;

  return {
    temp: current?.temperature_2m,
    wind: current?.wind_speed_10m,
    code: current?.weather_code,
    daily: daily ? {
        time: daily.time,
        code: daily.weather_code,
        max: daily.temperature_2m_max,
        min: daily.temperature_2m_min
    } : null
  };
}

export function clothingTip(tempC, code) {
  if (tempC == null) return "날씨 정보를 불러오는 중이에요.";
  
  // 1. Special Weather Conditions (Snow/Rain)
  // Codes: 71,73,75,77 (Snow), 51-67, 80-82 (Rain)
  if (code >= 71 && code <= 77) return "눈이 오고 있어요 ☃️ 미끄럽지 않은 신발과 두꺼운 외투를 챙기세요!";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "비가 오고 있어요 ☔ 우산과 방수 되는 신발을 추천해요.";

  // 2. Temperature Based
  if (tempC <= 5) return "기온이 낮아요. 패딩/장갑 같은 방한 준비 꼭 해요!";
  if (tempC <= 12) return "쌀쌀할 수 있어요. 자켓/맨투맨 챙기면 좋아요.";
  if (tempC <= 20) return "선선해요. 긴팔이나 얇은 겉옷 추천!";
  if (tempC <= 28) return "따뜻해요. 반팔도 가능해요! (실내 냉방 대비 얇은 겉옷도 OK)";
  return "무더운 날씨! 시원한 옷차림과 수분 섭취 잊지 마세요 ☀️";
}

export function getWeatherLabel(code) {
    if (code === 0) return "맑음 ☀️";
    if (code >= 1 && code <= 3) return "구름 조금 ⛅";
    if (code >= 45 && code <= 48) return "안개 🌫️";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "비 ☔";
    if (code >= 71 && code <= 77) return "눈 ☃️";
    if (code >= 95) return "천둥번개 ⚡";
    return "흐림 ☁️";
}

// Compare target temp with Seoul's current temp
export async function compareWithKorea(targetTemp) {
    if (targetTemp == null) return null;
    try {
        // Seoul Coordinates
        const seoul = await fetchCurrentWeatherByLatLon(37.5665, 126.9780);
        if (!seoul || seoul.temp == null) return null;
        
        const diff = targetTemp - seoul.temp;
        const absDiff = Math.abs(diff).toFixed(1);
        
        if (Math.abs(diff) < 2) return "한국(서울)과 기온이 비슷해요.";
        if (diff > 0) return `한국보다 ${absDiff}°C 더 더워요 🥵`;
        return `한국보다 ${absDiff}°C 더 추워요 🥶`;
    } catch (e) {
        return "한국 날씨 비교 불가";
    }
}