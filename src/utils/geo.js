// 여행 추천에서 필요한 최소 지리 유틸

export function haversineKm(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Nominatim (OpenStreetMap) 기반 간단 지오코딩
// - 키 없이 동작
// - CORS/RateLimit 이슈가 있을 수 있어, 실패 시 fallback을 사용하세요.
export async function geocodeCity(query) {
  const q = String(query ?? '').trim();
  if (!q) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', `${q}, South Korea`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim 권장: User-Agent/Referer (브라우저에선 제한적이지만, 최소한 Accept)
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`지오코딩 실패: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

// 한국 주요 도시 fallback 좌표 (지오코딩이 막힐 때 대비)
export const KOREA_CITY_COORDS = {
  서울: { lat: 37.5665, lng: 126.9780 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  인천: { lat: 37.4563, lng: 126.7052 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  수원: { lat: 37.2636, lng: 127.0286 },
  고양: { lat: 37.6584, lng: 126.8320 },
  성남: { lat: 37.4200, lng: 127.1265 },
  용인: { lat: 37.2411, lng: 127.1776 },
  창원: { lat: 35.2270, lng: 128.6810 },
  전주: { lat: 35.8242, lng: 127.1480 },
  포항: { lat: 36.0190, lng: 129.3435 },
  제주: { lat: 33.4996, lng: 126.5312 },
  강릉: { lat: 37.7519, lng: 128.8761 },
  구미: { lat: 36.1195, lng: 128.3446 },
};
