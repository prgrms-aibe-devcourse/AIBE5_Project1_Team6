
const CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = 0;

/**
 * Get Amadeus Access Token (Client Credentials Flow)
 */
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error_description || "Failed to get access token");
    }

    const data = await response.json();
    accessToken = data.access_token;
    // expires_in is in seconds. Buffer 60s for safety.
    tokenExpiresAt = now + (data.expires_in - 60) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error("Amadeus Auth Error:", error);
    throw error;
  }
}

// 🇰🇷 한글 검색 지원을 위한 방대한 도시 매핑 (가나다순 정렬 추천)
// 🇰🇷 한글 검색 지원을 위한 방대한 도시 매핑 (가나다순 정렬 추천)
const CITY_MAPPING = {
  // 🇯🇵 일본
  "도쿄": "Tokyo", "동경": "Tokyo", "일본": "Tokyo",
  "오사카": "Osaka", "오사가": "Osaka",
  "후쿠오카": "Fukuoka", "하카타": "Fukuoka",
  "삿포로": "Sapporo", "훗카이도": "Sapporo", "북해도": "Sapporo",
  "교토": "Kyoto", "고베": "Kobe", "나라": "Nara",
  "나고야": "Nagoya", "오키나와": "Naha", "나하": "Naha",
  "유후인": "Oita", "벳푸": "Oita",
  
  // 🇻🇳 베트남
  "다낭": "Da Nang", "하노이": "Hanoi", "호치민": "Ho Chi Minh City", "사이공": "Ho Chi Minh City", "베트남": "Da Nang",
  "나트랑": "Nha Trang", "냐짱": "Nha Trang", "푸꾸옥": "Phu Quoc", "달랏": "Da Lat",

  // 🇹🇭 태국
  "방콕": "Bangkok", "푸켓": "Phuket", "치앙마이": "Chiang Mai", "파타야": "Pattaya", "코사무이": "Koh Samui", "태국": "Bangkok",

  // 🇵🇭 필리핀
  "세부": "Cebu", "보라카이": "Caticlan", "마닐라": "Manila", "클락": "Clark", "보홀": "Tagbilaran", "필리핀": "Cebu",

  // 🇺🇸 미국/하와이/괌
  "미국": "New York", "뉴욕": "New York", "맨해튼": "New York",
  "엘에이": "Los Angeles", "로스앤젤레스": "Los Angeles", "LA": "Los Angeles",
  "샌프란시스코": "San Francisco", "라스베가스": "Las Vegas", "시애틀": "Seattle", "시카고": "Chicago",
  "하와이": "Honolulu", "호놀룰루": "Honolulu", "와이키키": "Honolulu",
  "괌": "Guam", "사이판": "Saipan",

  // 🇪🇺 유럽
  "유럽": "Paris", 
  "파리": "Paris", "프랑스": "Paris",
  "런던": "London", "영국": "London",
  "로마": "Rome", "이탈리아": "Rome", "밀라노": "Milan", "베네치아": "Venice", "베니스": "Venice", "피렌체": "Florence",
  "바르셀로나": "Barcelona", "마드리드": "Madrid", "스페인": "Barcelona",
  "스위스": "Zurich", "취리히": "Zurich", "인터라켄": "Interlaken", "제네바": "Geneva",
  "독일": "Berlin", "베를린": "Berlin", "프랑크푸르트": "Frankfurt", "뮌헨": "Munich",
  "프라하": "Prague", "체코": "Prague",
  "비엔나": "Vienna", "빈": "Vienna", "오스트리아": "Vienna",
  "부다페스트": "Budapest", "헝가리": "Budapest",

  // 🌏 기타 아시아/태평양
  "중국": "Beijing", "베이징": "Beijing", "상하이": "Shanghai",
  "싱가포르": "Singapore", "싱가폴": "Singapore",
  "발리": "Bali", "덴파사르": "Denpasar", "자카르타": "Jakarta", "인도네시아": "Bali",
  "홍콩": "Hong Kong", "마카오": "Macau",
  "타이베이": "Taipei", "대만": "Taipei", "가오슝": "Kaohsiung",
  "시드니": "Sydney", "멜버른": "Melbourne", "호주": "Sydney",
  "코타키나발루": "Kota Kinabalu", "말레이시아": "Kuala Lumpur", "쿠알라룸푸르": "Kuala Lumpur",
  "몰디브": "Male",

  // 🇰🇷 국내 (혹시나 해서)
  "서울": "Seoul", "인천": "Incheon", "부산": "Busan", "제주": "Jeju"
};

// 🛡️ API 데이터 부족 시(Test Env 제한) 사용할 강제 Fallback 데이터
const MOCK_LOCATIONS = {
  "Tokyo": { id: "MOCK_TYO", name: "Tokyo", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 35.6762, longitude: 139.6503 }, iataCode: "TYO" },
  "Osaka": { id: "MOCK_OSA", name: "Osaka", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 34.6937, longitude: 135.5023 }, iataCode: "OSA" },
  "Fukuoka": { id: "MOCK_FUK", name: "Fukuoka", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 33.5902, longitude: 130.4017 }, iataCode: "FUK" },
  "Sapporo": { id: "MOCK_SPK", name: "Sapporo", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 43.0618, longitude: 141.3545 }, iataCode: "CTS" },
  "Kyoto": { id: "MOCK_UKY", name: "Kyoto", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 35.0116, longitude: 135.7681 }, iataCode: "UKY" },
  "Naha": { id: "MOCK_OKA", name: "Naha", address: { countryName: "Japan", countryCode: "JP" }, geoCode: { latitude: 26.2124, longitude: 127.6809 }, iataCode: "OKA" },
  
  "Da Nang": { id: "MOCK_DAD", name: "Da Nang", address: { countryName: "Vietnam", countryCode: "VN" }, geoCode: { latitude: 16.0544, longitude: 108.2022 }, iataCode: "DAD" },
  "Hanoi": { id: "MOCK_HAN", name: "Hanoi", address: { countryName: "Vietnam", countryCode: "VN" }, geoCode: { latitude: 21.0285, longitude: 105.8542 }, iataCode: "HAN" },
  "Ho Chi Minh City": { id: "MOCK_SGN", name: "Ho Chi Minh City", address: { countryName: "Vietnam", countryCode: "VN" }, geoCode: { latitude: 10.8231, longitude: 106.6297 }, iataCode: "SGN" },
  "Nha Trang": { id: "MOCK_CXR", name: "Nha Trang", address: { countryName: "Vietnam", countryCode: "VN" }, geoCode: { latitude: 12.2388, longitude: 109.1969 }, iataCode: "CXR" },
  
  "Bangkok": { id: "MOCK_BKK", name: "Bangkok", address: { countryName: "Thailand", countryCode: "TH" }, geoCode: { latitude: 13.7563, longitude: 100.5018 }, iataCode: "BKK" },
  "Cebu": { id: "MOCK_CEB", name: "Cebu", address: { countryName: "Philippines", countryCode: "PH" }, geoCode: { latitude: 10.3157, longitude: 123.8854 }, iataCode: "CEB" },
  
  "Paris": { id: "MOCK_PAR", name: "Paris", address: { countryName: "France", countryCode: "FR" }, geoCode: { latitude: 48.8566, longitude: 2.3522 }, iataCode: "PAR" },
  "London": { id: "MOCK_LON", name: "London", address: { countryName: "United Kingdom", countryCode: "GB" }, geoCode: { latitude: 51.5074, longitude: -0.1278 }, iataCode: "LON" },
  "New York": { id: "MOCK_NYC", name: "New York", address: { countryName: "United States", countryCode: "US" }, geoCode: { latitude: 40.7128, longitude: -74.0060 }, iataCode: "NYC" },
};

/**
 * Search cities by keyword
 * Smart Mapping applied for Korean inputs.
 */
export async function searchCity(keyword) {
  const token = await getAccessToken();

  // Normalize to handle disparate unicode forms (e.g. MacOS Hangul)
  let searchKeyword = keyword.trim().normalize("NFC");
  
  // 1️⃣ Strict Match (Mapping)
  if (CITY_MAPPING[searchKeyword]) {
    searchKeyword = CITY_MAPPING[searchKeyword];
  } else {
    // 2️⃣ Partial Match (Smart Search)
    const matchedKey = Object.keys(CITY_MAPPING).find(key => searchKeyword.includes(key));
    if (matchedKey) {
        searchKeyword = CITY_MAPPING[matchedKey];
    }
  }

  // 3️⃣ Korean Char Check
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(searchKeyword)) {
      console.warn("Unsupported Korean keyword:", searchKeyword);
      return []; 
  }

  console.log("✈️ Amadeus Searching for:", searchKeyword);

  // API Call
  // Using subType=CITY,AIRPORT significantly improves hit rate in Test Environment
  const url = `https://test.api.amadeus.com/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(searchKeyword)}&page[limit]=5`;

  try {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("City search failed");
    
    const json = await response.json();
    
    // ✅ Fallback Logic: If API returns empty, check our MOCK_LOCATIONS
    if (!json.data || json.data.length === 0) {
        // searchKeyword is now likely English (e.g., "Tokyo")
        // Check exact match (Case Insensitive) in MOCK_LOCATIONS
        const mockKey = Object.keys(MOCK_LOCATIONS).find(k => k.toLowerCase() === searchKeyword.toLowerCase());
        if (mockKey) {
            console.log(`⚠️ API returned empty for ${searchKeyword}, using MOCK fallback.`);
            return [MOCK_LOCATIONS[mockKey]];
        }
    }

    return json.data || [];
  } catch (e) {
      console.error("Amadeus Search Error:", e);
      // Even on error, try fallback!
      const mockKey = Object.keys(MOCK_LOCATIONS).find(k => k.toLowerCase() === searchKeyword.toLowerCase());
      if (mockKey) return [MOCK_LOCATIONS[mockKey]];
      
      throw e;
  }
}

/**
 * Get Tours and Activities (Replacing deprecated POI endpoint)
 * @param {number} lat 
 * @param {number} lon 
 */
export async function getPointsOfInterest(lat, lon) {
  const token = await getAccessToken();
  // Use Tours and Activities endpoint (Tours, Sights, etc.)
  // Radius default is small, let's set 5km or 10km
  const url = `https://test.api.amadeus.com/v1/shopping/activities?latitude=${lat}&longitude=${lon}&radius=10`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
     const err = await response.json();
     // If 404/410 or others, just return empty to avoid breaking UI
     console.warn("Activities Fetch Warning:", err);
     return []; 
  }

  const json = await response.json();
  // Map 'Activities' structure to our simple POI format
  // Activity object has { name, pictures: [{href}], price: {amount, currencyCode}, bookingLink, ... }
  
  if (!json.data) return [];

  return json.data.map(item => ({
      name: item.name,
      category: "Activity", // API doesn't strictly have category like 'SIGHTS', it's implicit
      images: item.pictures?.map(p => p.href) || [] 
  }));
}
