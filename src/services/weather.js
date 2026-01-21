// Open-Meteo: API 키 없이 사용 가능
export async function fetchCurrentWeatherByLatLon(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();

  const current = data.current;
  return {
    temp: current?.temperature_2m,
    wind: current?.wind_speed_10m,
    code: current?.weather_code,
  };
}

export function clothingTip(tempC) {
  if (tempC == null) return "날씨 정보를 불러오는 중이에요.";
  if (tempC <= 5) return "기온이 낮아요. 패딩/장갑 같은 방한 준비 꼭 해요!";
  if (tempC <= 12) return "쌀쌀할 수 있어요. 자켓/맨투맨 챙기면 좋아요.";
  if (tempC <= 20) return "선선해요. 긴팔이나 얇은 겉옷 추천!";
  return "따뜻해요. 반팔도 가능해요! (실내 냉방 대비 얇은 겉옷도 OK)";
}