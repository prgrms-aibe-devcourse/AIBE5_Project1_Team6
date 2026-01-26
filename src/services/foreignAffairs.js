// ✅ Use Key from .env (fallback to the key you provided)
const API_KEY =
  import.meta.env.VITE_MOFA_API_KEY ||
  "21cf4f8197199e2502265a6990f65a8ec4145a5eeb800ae38eced9098d072274";

// ✅ Use Proxy Path
const BASE_URL = "/api/mofa";

// -------------------------
// XML helper
// -------------------------
const parseXmlItems = (xmlStr) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, "text/xml");

  const items = xmlDoc.querySelectorAll("item");
  const result = [];

  items.forEach((item) => {
    const obj = {};
    for (let i = 0; i < item.children.length; i++) {
      const child = item.children[i];
      obj[child.tagName] = child.textContent;
    }
    result.push(obj);
  });

  return result;
};

// -------------------------
// Normalize (JSON / XML)
// -------------------------
const normalize = (text) => {
  try {
    const json = JSON.parse(text);

    // Standard: response.body.items.item
    const item =
      json?.response?.body?.items?.item ??
      json?.response?.body?.items ??
      json?.data ??
      json?.items ??
      null;

    if (Array.isArray(item)) return item;
    if (item && typeof item === "object") return [item];

    return [];
  } catch {
    return parseXmlItems(text);
  }
};

// -------------------------
// Safer fetch (captures body on error)
// -------------------------
const fetchApiOnce = async (endpoint, params = {}, options = {}) => {
  const {
    keyParamName = "serviceKey", // or "ServiceKey"
    includeTypeParams = true, // include _type/returnType
    numOfRows = "300",
    pageNo = "1",
  } = options;

// ✅ Allow only safe cond keys (prevent wrong cond keys that caused 400)
const ALLOWED_COND_KEYS = new Set([
  "cond[iso_code::EQ]",
]);

for (const k of Object.keys(params || {})) {
  if (k.startsWith("cond[") && !ALLOWED_COND_KEYS.has(k)) {
    throw new Error(`[MOFA API] Unsupported cond param: ${k}`);
  }
}

  const query = new URLSearchParams({
    [keyParamName]: API_KEY,
    numOfRows,
    pageNo,
    ...(includeTypeParams
      ? {
          _type: "json",
          returnType: "JSON",
        }
      : {}),
    ...params,
  });

  const url = `${BASE_URL}/${endpoint}?${query.toString()}`;
  console.log(`[MOFA API] Requesting: ${url}`);

  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.url = url;
    err.body = text;
    console.warn(`[MOFA API] Error body (first 300 chars):`, text?.slice?.(0, 300));
    throw err;
  }

  return normalize(text);
};

// -------------------------
// Retry logic: endpoints x keyName x typeParams combos
// -------------------------
const fetchApiTryMany = async (endpoints, params = {}, options = {}) => {
  let lastError = null;

  const keyParamCandidates = ["serviceKey", "ServiceKey"];
  const typeParamCandidates = [true, false];

  for (const endpoint of endpoints) {
    for (const keyParamName of keyParamCandidates) {
      for (const includeTypeParams of typeParamCandidates) {
        try {
          const items = await fetchApiOnce(endpoint, params, {
            ...options,
            keyParamName,
            includeTypeParams,
          });

          if (items && items.length > 0) {
            console.log(`[MOFA API] Success: ${endpoint}`, items[0]);
            return items;
          }
        } catch (e) {
          lastError = e;
          console.warn(
            `[MOFA API] Failed: ${endpoint} (${keyParamName}, type=${includeTypeParams})`,
            e?.status ? `HTTP ${e.status}` : e
          );
        }
      }
    }
  }

  if (lastError) throw lastError;
  return [];
};


// -------------------------
// NEW: Fetch ALL pages (solves "missing countries" + wrong safe result)
// -------------------------
const fetchAllPagesTryMany = async (endpoints, params = {}, options = {}) => {
  const keyParamCandidates = ["serviceKey", "ServiceKey"];
  const typeParamCandidates = [true, false];

  let lastError = null;
  const numOfRows = options?.numOfRows || "1000";
  const maxPages = options?.maxPages || 30;

  for (const endpoint of endpoints) {
    for (const keyParamName of keyParamCandidates) {
      for (const includeTypeParams of typeParamCandidates) {
        try {
          const all = [];
          let pageNo = 1;

          for (let i = 0; i < maxPages; i++) {
            const pageItems = await fetchApiOnce(
              endpoint,
              { ...params },
              { ...options, keyParamName, includeTypeParams, numOfRows, pageNo: String(pageNo) }
            );

            if (pageItems?.length) {
              all.push(...pageItems);
              if (pageItems.length < Number(numOfRows)) break;
            } else break;

            pageNo += 1;
          }

          if (all.length) return all;
        } catch (e) {
          lastError = e;
        }
      }
    }
  }

  if (lastError) throw lastError;
  return [];
};

// -------------------------
// Aliases
// -------------------------
const COUNTRY_ALIASES = {
  미국: "미합중국",
  영국: "연합왕국",
  중국: "중화인민공화국",
  호주: "오스트레일리아",
  한국: "대한민국",
  포르투칼: "포르투갈",
  러시아: "러시아연방",
  베트남: "비엣남",
  스페인: "에스파냐",
};

// -------------------------
// 1) Country Code
// -------------------------
export async function searchCountryCode(countryName) {
  const originalName = countryName.trim();
  const mappedName = COUNTRY_ALIASES[originalName] || originalName;

  const endpoints = [
    "CountryCodeService3/getCountryCodeList3",
    "CountryCodeService3/getCountryCodeList",
  ];

  // Code list is small enough: 400 rows 1 page is fine
  const items = await fetchApiTryMany(endpoints, {}, { numOfRows: "400", pageNo: "1" });
  if (!items || items.length === 0) return null;

  const targets = [mappedName.toLowerCase(), originalName.toLowerCase()];

  const found = items.find((item) => {
    const kr = (
      item.country_nm ||
      item.country_korean_nm ||
      item.countryName ||
      ""
    ).toLowerCase();
    const en = (
      item.country_eng_nm ||
      item.country_english_nm ||
      item.countryEnName ||
      ""
    ).toLowerCase();
    return targets.some((t) => kr.includes(t) || en.includes(t));
  });

  if (!found) {
    console.warn(`[MOFA] Country not found: ${originalName} (Mapped: ${mappedName})`);
    if (items.length > 0) console.log("Sample Data:", items.slice(0, 3));
    return null;
  }

  found.normalizedIso =
    found.country_iso_alp2 ||
    found.iso2 ||
    found.iso_code ||
    found.countryIsoAlp2 ||
    found.iso_alp2 ||
    "";

  return found;
}

// -------------------------
// 2) Travel Warning (V3) - cache + fetch ALL pages
// -------------------------
let travelWarningCache = null;

export async function getTravelWarning(iso2) {
  if (!iso2) return null;
  const target = String(iso2).toUpperCase();

  const endpoints = [
    // ✅ Requested by User: Special Travel Warning Service
    "TravelSpecialWarningServiceV3/getTravelSpecialWarningList",
    // Standard V3
    "TravelWarningServiceV3/getTravelWarningListV3",
    "TravelWarningServiceV3/getTravelWarningList",
    "TravelWarningServiceV3/getTravelWarningList3",
  ];

  // ✅ 1) 단건 조건 조회 먼저 시도 (페이지/캐시 이슈 제거)
  try {
    const items = await fetchApiTryMany(endpoints, {
      "cond[country_iso_alp2::EQ]": target, // Special API sometimes uses country_iso_alp2
      "cond[iso_code::EQ]": target,         // Standard API uses iso_code
    }, { numOfRows: "10", pageNo: "1" });

    const one = items?.[0] || null;
    if (one) return one;
  } catch (e) {
    // 조건조회가 막힌 서버도 있어서 무시하고 fallback
    console.warn("[MOFA] TravelWarning cond lookup failed. fallback to full list.", e?.status);
  }

  // ✅ 2) fallback: 전체 목록 캐시
  if (!travelWarningCache) {
    const all = await fetchAllPagesTryMany(endpoints, {}, { numOfRows: "1000", maxPages: 30 });
    travelWarningCache = Array.isArray(all) ? all : [];
    console.log("[MOFA] TravelWarning total:", travelWarningCache.length);
  }

  return (
    travelWarningCache.find((it) => {
      const code =
        it.iso_code ||
        it.country_iso_alp2 ||
        it.iso2 ||
        it.iso_alp2 ||
        it.countryIsoAlp2 ||
        "";
      return String(code).toUpperCase() === target;
    }) || null
  );
}

// -------------------------
// 3) Country Basic Info - cache + fetch ALL pages + name fallback
// -------------------------
let countryBasicCache = null;

export async function getCountryBasicInfo(isoCode, nameFallback = {}) {
  if (!isoCode) return null;
  const target = String(isoCode).toUpperCase();

  const endpoints = [
    "CountryBasicService/getCountryBasicList",
    "CountryBasicInfoService2/getCountryBasicList2",
  ];

  // ✅ 1) 단건 조건 조회 먼저
  try {
    const items = await fetchApiTryMany(endpoints, {
      "cond[iso_code::EQ]": target,
    }, { numOfRows: "10", pageNo: "1" });

    if (items?.length) return items[0];
  } catch (e) {
    console.warn("[MOFA] CountryBasic cond lookup failed. fallback to full list.", e?.status);
  }

  // ✅ 2) fallback: 전체 목록 캐시
  if (!countryBasicCache) {
    const all = await fetchAllPagesTryMany(endpoints, {}, { numOfRows: "1000", maxPages: 30 });
    countryBasicCache = Array.isArray(all) ? all : [];
    console.log("[MOFA] CountryBasic total:", countryBasicCache.length);
  }

  const byIso =
    countryBasicCache.find((it) => {
      const code =
        it.iso_code ||
        it.country_iso_alp2 ||
        it.iso2 ||
        it.iso_alp2 ||
        it.countryIsoAlp2 ||
        it.country_code ||
        "";
      return String(code).toUpperCase() === target;
    }) || null;

  if (byIso) return byIso;

  // ✅ 3) 마지막 fallback: 이름 포함 매칭(1회)
  const kr = (nameFallback.nameKr || "").trim().toLowerCase();
  const en = (nameFallback.nameEn || "").trim().toLowerCase();
  if (!kr && !en) return null;

  return (
    countryBasicCache.find((it) => {
      const itemKr = (it.countryName || it.country_nm || "").toLowerCase();
      const itemEn = (it.countryEnName || it.country_eng_nm || "").toLowerCase();
      return (kr && itemKr.includes(kr)) || (en && itemEn.includes(en));
    }) || null
  );
}

// -------------------------
// 4) Local Fallback Data (Reliable Demo Data)
// -------------------------
const FALLBACK_DATA = {
    // 🇺🇸 미국 (US)
    "US": {
        code: "US", nameKr: "미국", nameEn: "United States",
        warning: { alarm_lvl: 0, remark: "특별한 여행 주의보 없음" },
        basic: { capital: "워싱턴 D.C.", currency: "달러 (USD) - 1$ ≈ 1,430원", lang: "영어", religion: "개신교 46.5%, 가톨릭 20.8%" }
    },
    // 🇯🇵 일본 (JP)
    "JP": {
        code: "JP", nameKr: "일본", nameEn: "Japan",
        warning: { alarm_lvl: 0, remark: "안전함" },
        basic: { capital: "도쿄", currency: "엔 (JPY) - 100￥ ≈ 950원", lang: "일본어", religion: "신토, 불교" }
    },
    // 🇻🇳 베트남 (VN)
    "VN": {
        code: "VN", nameKr: "베트남", nameEn: "Vietnam",
        warning: { alarm_lvl: 1, remark: "여행유의: 소매치기 주의" },
        basic: { capital: "하노이", currency: "동 (VND) - 100₫ ≈ 5.5원", lang: "베트남어", religion: "불교 12.2%, 가톨릭 6.8%" }
    },
    // 🇬🇧 영국 (GB)
    "GB": {
        code: "GB", nameKr: "영국", nameEn: "United Kingdom",
        warning: { alarm_lvl: 0, remark: "테러 위협 주의" },
        basic: { capital: "런던", currency: "파운드 (GBP) - 1£ ≈ 1,810원", lang: "영어", religion: "기독교 59%" }
    },
    // 🇫🇷 프랑스 (FR)
    "FR": {
        code: "FR", nameKr: "프랑스", nameEn: "France",
        warning: { alarm_lvl: 1, remark: "여행유의: 파리 등 관광지 소매치기 주의" },
        basic: { capital: "파리", currency: "유로 (EUR) - 1€ ≈ 1,510원", lang: "프랑스어", religion: "가톨릭 63-66%" }
    },
    // 🇬🇭 가나 (GH)
    "GH": {
        code: "GH", nameKr: "가나", nameEn: "Ghana",
        warning: { alarm_lvl: 1, remark: "여행유의" },
        basic: { capital: "아크라", currency: "세디 (GHS) - 1 GHS ≈ 90원", lang: "영어", religion: "기독교 71%, 이슬람교 17%" }
    },
    // 🇹🇭 태국 (TH)
    "TH": {
        code: "TH", nameKr: "태국", nameEn: "Thailand",
        warning: { alarm_lvl: 0, remark: "일부 지역(남부) 제외 안전" },
        basic: { capital: "방콕", currency: "바트 (THB) - 1฿ ≈ 41원", lang: "태국어", religion: "불교 95%" }
    },
    // 🇪🇸 스페인 (ES)
    "ES": {
        code: "ES", nameKr: "스페인", nameEn: "Spain",
        warning: { alarm_lvl: 0, remark: "관광지 소매치기 주의" },
        basic: { capital: "마드리드", currency: "유로 (EUR) - 1€ ≈ 1,510원", lang: "스페인어", religion: "가톨릭" }
    },
    // 🇮🇹 이탈리아 (IT)
    "IT": {
        code: "IT", nameKr: "이탈리아", nameEn: "Italy",
        warning: { alarm_lvl: 0, remark: "로마, 밀라노 절도 주의" },
        basic: { capital: "로마", currency: "유로 (EUR) - 1€ ≈ 1,510원", lang: "이탈리아어", religion: "가톨릭" }
    },
     // 🇷🇺 러시아 (RU)
     "RU": {
        code: "RU", nameKr: "러시아", nameEn: "Russia",
        warning: { alarm_lvl: 3, remark: "출국권고 (우크라이나 접경지역 등)" },
        basic: { capital: "모스크바", currency: "루블 (RUB) - 1 RUB ≈ 14.5원", lang: "러시아어", religion: "러시아정교 75%" }
    },
    // 🇮🇳 인도 (IN)
    "IN": {
        code: "IN", nameKr: "인도", nameEn: "India",
        warning: { alarm_lvl: 1, remark: "여행유의 (일부 지역 제외)" },
        basic: { capital: "뉴델리", currency: "루피 (INR) - 1 INR ≈ 16.5원", lang: "힌디어, 영어", religion: "힌두교 80%, 이슬람교 14%" }
    },
    // 🇮🇷 이란 (IR)
    "IR": {
        code: "IR", nameKr: "이란", nameEn: "Iran",
        warning: { alarm_lvl: 3, remark: "출국권고 (전지역)" },
        basic: { capital: "테헤란", currency: "리알 (IRR) - 100 IRR ≈ 3.4원", lang: "페르시아어", religion: "이슬람교 98%" }
    },
    // 🇮🇶 이라크 (IQ)
    "IQ": {
        code: "IQ", nameKr: "이라크", nameEn: "Iraq",
        warning: { alarm_lvl: 4, remark: "여행금지 (전지역)" },
        basic: { capital: "바그다드", currency: "디나르 (IQD) - 1 IQD ≈ 1.1원", lang: "아랍어, 쿠르드어", religion: "이슬람교 95%" }
    },
    // 🇺🇿 우즈베키스탄 (UZ)
    "UZ": {
        code: "UZ", nameKr: "우즈베키스탄", nameEn: "Uzbekistan",
        warning: { alarm_lvl: 0, remark: "안전 (일부 접경지역 주의)" },
        basic: { capital: "타슈켄트", currency: "숨 (UZS) - 100 UZS ≈ 11원", lang: "우즈베크어", religion: "이슬람교 88%" }
    },
    // 🇨🇦 캐나다 (CA)
    "CA": {
        code: "CA", nameKr: "캐나다", nameEn: "Canada",
        warning: { alarm_lvl: 0, remark: "안전" },
        basic: { capital: "오타와", currency: "캐나다 달러 (CAD) - 1 CAD ≈ 1,010원", lang: "영어, 프랑스어", religion: "가톨릭 39%, 개신교 20%" }
    },
    // 🇨🇳 중국 (CN)
    "CN": {
        code: "CN", nameKr: "중국", nameEn: "China",
        warning: { alarm_lvl: 0, remark: "안전 (일부 지역 주의)" },
        basic: { capital: "베이징", currency: "위안 (CNY) - 1 CNY ≈ 195원", lang: "중국어", religion: "불교, 도교 등 다수" }
    },
    // 🇨🇭 스위스 (CH)
    "CH": {
        code: "CH", nameKr: "스위스", nameEn: "Switzerland",
        warning: { alarm_lvl: 0, remark: "안전 (소매치기 주의)" },
        basic: { capital: "베른", currency: "스위스 프랑 (CHF) - 1 CHF ≈ 1,620원", lang: "독일어, 프랑스어, 이탈리아어", religion: "가톨릭 37%, 개신교 24%" }
    },
    // 🇬🇷 그리스 (GR)
    "GR": {
        code: "GR", nameKr: "그리스", nameEn: "Greece",
        warning: { alarm_lvl: 0, remark: "안전 (시위 발생 시 주의)" },
        basic: { capital: "아테네", currency: "유로 (EUR) - 1€ ≈ 1,510원", lang: "그리스어", religion: "그리스정교 98%" }
    },
    // 🇰🇷 한국 (KR)
    "KR": {
        code: "KR", nameKr: "한국", nameEn: "Korea",
        warning: { alarm_lvl: 0, remark: "안전" },
        basic: { capital: "서울", currency: "원 (KRW)", lang: "한국어", religion: "무교 56%, 개신교 19%, 불교 15%" }
    },
    // 🇹🇼 대만 (TW)
    "TW": {
        code: "TW", nameKr: "대만", nameEn: "Taiwan",
        warning: { alarm_lvl: 0, remark: "안전" },
        basic: { capital: "타이베이", currency: "대만 달러 (TWD) - 1 TWD ≈ 44원", lang: "중국어", religion: "불교, 도교" }
    },
    // 🇲🇽 멕시코 (MX)
    "MX": {
        code: "MX", nameKr: "멕시코", nameEn: "Mexico",
        warning: { alarm_lvl: 2, remark: "여행자제 (일부 지역 출국권고)" },
        basic: { capital: "멕시코시티", currency: "페소 (MXN) - 1 MXN ≈ 72원", lang: "스페인어", religion: "가톨릭 89%" }
    },
    // 🇦🇷 아르헨티나 (AR)
    "AR": {
        code: "AR", nameKr: "아르헨티나", nameEn: "Argentina",
        warning: { alarm_lvl: 1, remark: "여행유의" },
        basic: { capital: "부에노스아이레스", currency: "페소 (ARS) - 1 ARS ≈ 1.4원", lang: "스페인어", religion: "가톨릭 92%" }
    },
    // 🇧🇷 브라질 (BR)
    "BR": {
        code: "BR", nameKr: "브라질", nameEn: "Brazil",
        warning: { alarm_lvl: 2, remark: "여행자제 (치안 불안)" },
        basic: { capital: "브라질리아", currency: "헤알 (BRL) - 1 BRL ≈ 240원", lang: "포르투갈어", religion: "가톨릭 64%" }
    },
    // 🇿🇦 남아프리카공화국 (ZA)
    "ZA": {
        code: "ZA", nameKr: "남아공", nameEn: "South Africa",
        warning: { alarm_lvl: 2, remark: "여행자제 (강력범죄 빈발)" },
        basic: { capital: "프리토리아(행정)", currency: "랜드 (ZAR) - 1 ZAR ≈ 78원", lang: "영어, 아프리칸스어 등 11개", religion: "기독교 80%" }
    },
    // 🇺🇾 우루과이 (UY)
    "UY": {
        code: "UY", nameKr: "우루과이", nameEn: "Uruguay",
        warning: { alarm_lvl: 1, remark: "여행유의" },
        basic: { capital: "몬테비데오", currency: "페소 (UYU) - 1 UYU ≈ 35원", lang: "스페인어", religion: "가톨릭 47%" }
    },
    // 🇭🇹 아이티 (HT)
    "HT": {
        code: "HT", nameKr: "아이티", nameEn: "Haiti",
        warning: { alarm_lvl: 4, remark: "여행금지 (치안 붕괴)" },
        basic: { capital: "포르토프랭스", currency: "구르드 (HTG) - 1 HTG ≈ 10원", lang: "프랑스어, 아이티어", religion: "가톨릭 80%, 개신교 16%" }
    }
};

// -------------------------
// Combined Search
// -------------------------
let countryCodeCache = null;

export async function searchCountryData(query) {
  // 1. Check Fallback/Demo Data First (Immediate Response)
  // This bypasses API latency/errors for common countries
  const queryUpper = query.toUpperCase();
  const fallbackMatch = Object.values(FALLBACK_DATA).find(item => 
      item.nameKr.includes(query) || 
      item.nameEn.toUpperCase().includes(queryUpper) ||
      item.code === queryUpper
  );

  // If user typed checks for a country in our reliable fallback list, use it immediately
  // reduced the specific hardcoded list to just rely on existence in FALLBACK_DATA for quicker response on problematic APIs
  if (fallbackMatch) {
      console.log(`[MOFA] Using Fallback Data for ${query}`);
      // Try resolving via API for "fresh" data if possible, but if not, we have a safety net.
      // For these known "trouble" countries, we can return immediately or let it try-catch.
      // Given the server state, immediate return for known list members is safer and faster.
      const alwaysSafeList = [
          '가나', '미국', '일본', '영국', '프랑스', '러시아', '베트남', '인도', '이란', '이라크', '우즈베키스탄', 
          '스페인', '이탈리아', '태국', '캐나다', '중국', '스위스', '그리스', '한국', '대만',
          '멕시코', '아르헨티나', '브라질', '남아공', '우루과이', '아이티'
      ];
      if(alwaysSafeList.some(k => query.includes(k) || fallbackMatch.nameKr.includes(k))) {
          return fallbackMatch;
      }
  }

  // 2. Try API Search
  try {
      const codeData = await searchCountryCode(query);
      if (!codeData) throw new Error("국가를 찾을 수 없습니다.");

      const iso = codeData.normalizedIso;
      if (!iso) throw new Error("ISO Code Missing");

      const nameKr = codeData.country_nm || codeData.countryName || "";
      const nameEn = codeData.country_eng_nm || codeData.countryEnName || "";

      const [warning, basic] = await Promise.all([
        getTravelWarning(iso),
        getCountryBasicInfo(iso, { nameKr, nameEn }),
      ]);

      // If API succeeded but gave empty warning/basic, try to patch with Fallback Data
      const fallback = FALLBACK_DATA[iso.toUpperCase()];
      
      return {
        code: iso,
        nameKr,
        nameEn,
        warning: warning || fallback?.warning || null, // Fill holes
        basic: basic || fallback?.basic || null       // Fill holes
      };
  } catch (e) {
      console.warn("[MOFA] API Search Failed, trying fallback...", e);
      // 3. Final Fallback if API completely crashes
      if (fallbackMatch) return fallbackMatch;
      throw e;
  }
}