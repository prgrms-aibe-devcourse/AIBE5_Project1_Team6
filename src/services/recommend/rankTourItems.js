/**
 * Lightweight ranking for KTO TourAPI items.
 * NOTE: TourAPI doesn't provide explicit "price" fields for most POIs.
 * We approximate "가성비" by favoring generally free/public spots (parks, views, mountains, beaches, rivers)
 * and deprioritizing content types that often cost more (paid activities, some food-heavy spots).
 */
const KEYWORDS = {
  scenery: [
    "전망", "뷰", "포토", "호수", "강", "하천", "산", "등산", "정상",
    "공원", "수목원", "숲", "해변", "바다", "해안", "섬", "노을", "일출", "일몰",
    "계곡", "폭포", "정원", "산책로", "둘레길", "트레킹"
  ],
  rest: ["카페", "휴식", "쉼", "힐링", "온천", "스파", "공원", "정원", "숲", "산책"],
  activity: ["체험", "액티비티", "레저", "서핑", "카약", "패러", "스키", "보드", "캠핑", "짚라인"],
  food: ["맛집", "식당", "먹거리", "시장", "푸드", "카페", "디저트"],
};

function textOf(item) {
  return `${item?.title ?? ""} ${item?.addr1 ?? ""} ${item?.addr2 ?? ""}`.toLowerCase();
}

function keywordScore(item, keywords) {
  const text = textOf(item);
  let score = 0;
  for (const k of keywords) {
    if (text.includes(k.toLowerCase())) score += 1;
  }
  return score;
}

// ContentType weights (very rough; depends on data availability)
function contentTypeWeight(contentTypeId, { budget, themes }) {
  const ct = Number(contentTypeId);
  // 12 관광지, 14 문화시설, 15 축제공연, 28 레포츠, 32 숙박, 38 쇼핑, 39 음식
  let w = 0;

  if (budget === "good") {
    // 가성비: 공공/야외/관광지(12) + 문화(14) 쪽을 살짝 우대
    if (ct === 12) w += 1.2;
    if (ct === 14) w += 0.6;
    if (ct === 28) w -= 0.2; // 레포츠는 비용 가능성 ↑
    if (ct === 39) w -= 0.3; // 음식점은 개인 지출 편차 큼
  }

  // 테마가 명확하면 해당 ct를 아주 살짝 우대
  if (Array.isArray(themes)) {
    if (themes.includes("food") && ct === 39) w += 0.8;
    if (themes.includes("activity") && ct === 28) w += 0.8;
    if (themes.includes("healing") && (ct === 12 || ct === 14)) w += 0.3;
  }

  return w;
}

function distanceScoreMeters(distMeters, { duration }) {
  const d = Number(distMeters);
  if (!Number.isFinite(d)) return 0;

  // duration=day(당일/1박): 가까울수록 점수 크게
  if (duration === "day") {
    if (d <= 1000) return 2.0;
    if (d <= 3000) return 1.2;
    if (d <= 7000) return 0.4;
    return -0.4;
  }

  // short/long: 거리에 대한 페널티를 완화
  if (duration === "short") {
    if (d <= 3000) return 1.2;
    if (d <= 8000) return 0.6;
    return 0;
  }

  return 0; // long은 거리 크게 신경 안 씀
}

/**
 * Rank TourAPI items by user preferences.
 * @param {Array<any>} items
 * @param {object} prefs - { priority, budget, duration, themes }
 */
export function rankTourItems(items, prefs = {}) {
  if (!Array.isArray(items)) return [];

  const { priority, budget, duration, themes } = prefs;

  const ranked = items
    .map((item) => {
      let score = 0;

      // 1) Priority keyword boost
      if (priority === "scenery") score += keywordScore(item, KEYWORDS.scenery) * 0.9;
      if (priority === "rest") score += keywordScore(item, KEYWORDS.rest) * 0.6;
      if (priority === "stamina") {
        // stamina is handled primarily by radius/arrange=E, but give a tiny distance bonus if dist exists
        score += distanceScoreMeters(item?.dist, { duration: "day" }) * 0.5;
      }

      // 2) Theme keyword tiny boost (fallback when contentType isn't enough)
      if (Array.isArray(themes)) {
        if (themes.includes("food")) score += keywordScore(item, KEYWORDS.food) * 0.2;
        if (themes.includes("activity")) score += keywordScore(item, KEYWORDS.activity) * 0.2;
      }

      // 3) Budget heuristic
      score += contentTypeWeight(item?.contenttypeid, { budget, themes });

      // 4) Duration routing tightness (uses dist when API returns it)
      score += distanceScoreMeters(item?.dist, { duration });

      // 5) Data quality small nudge
      if (item?.firstimage) score += 0.2;
      if (item?.addr1) score += 0.1;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);

  return ranked;
}
