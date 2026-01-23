export const TOUR_API_BASE_URL = "/tourapi/B551011/KorService2";
const API_KEY = import.meta.env.VITE_TOUR_API_KEY;

export async function fetchTourData(endpoint, params = {}) {
  const qs = new URLSearchParams({
    _type: "json",
    MobileOS: "ETC",
    MobileApp: "TripPlan",
    numOfRows: "20",
    pageNo: "1",
    ...Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ),
  });

  // ✅ 핵심: 그냥 문자열로 만든다
  const url = `/tourapi/B551011/KorService2${endpoint}?serviceKey=${API_KEY}&${qs.toString()}`;

  console.log("🔥 TourAPI URL:", url);

  const response = await fetch(url);
  const rawText = await response.text();

  console.log("🔥 RAW RESPONSE:", rawText.slice(0, 200));

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("TourAPI returned non-JSON response");
  }

  console.log("🔥 FULL API RESPONSE:", JSON.stringify(data, null, 2));

  console.log("TourAPI header:", data?.response?.header);
  console.log("TourAPI totalCount:", data?.response?.body?.totalCount);

  return data?.response?.body?.items?.item ?? [];
}