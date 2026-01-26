function suggestByKeywords(text) {
  const t = (text || "").toLowerCase();

  const tips = [];
  if (t.includes("혼자") || t.includes("혼행")) tips.push("혼행이면 동선 단순하게: 숙소 중심 반경 이동 추천!");
  if (t.includes("커플") || t.includes("연인")) tips.push("커플이면 야경/카페/사진 스팟 1~2개 꼭 넣기!");
  if (t.includes("가족")) tips.push("가족이면 이동 피로 줄이기: 하루 2~3개 코스로 넉넉하게!");
  if (t.includes("예산")) tips.push("예산 항목을 교통/식비/입장료/쇼핑으로 나눠 적어두면 좋아요.");
  if (t.includes("맛집")) tips.push("맛집은 피크 시간 회피: 점심 11:00~11:30 / 저녁 17:00~17:30 추천.");
  if (t.includes("바다")) tips.push("바다 코스는 바람이 변수! 얇은 바람막이 챙기면 좋아요.");

  return tips;
}

// Theme-based templates for smarter suggestions
const THEME_TEMPLATES = {
    activity: [
        "1일차: 도착 → 짐 보관 → [액티비티] 체험 → 에너지 보충(맛집) → 휴식",
        "2일차: 조식 → [오전] 가벼운 하이킹/산책 → [오후] 메인 레포츠 → 귀가 준비"
    ],
    healing: [
        "1일차: 숙소 체크인 → 근처 숲길/해변 산책 → 노을 감상 → 조용한 저녁",
        "2일차: 느긋한 기상 → 브런치 → [오후] 독서/티타임 → 여유로운 복귀"
    ],
    food: [
        "1일차: [점심] 현지 줄서는 식당 → 소화시킬 겸 산책 → [저녁] 야시장/노포 투어",
        "2일차: [아침] 유명 베이커리/해장국 → [점심] 숨은 로컬 맛집 → 카페 투어"
    ],
    default: [
        "1일차: 도착 → 체크인 → 주요 명소 방문 → 야경 감상",
        "2일차: 숙소 근처 산책 → 브런치 → 기념품 샵 → 복귀"
    ]
};

function getTemplateLines(theme = 'default', nights = 1) {
    const lines = THEME_TEMPLATES[theme] || THEME_TEMPLATES.default;
    // If nights > 1, reuse the 2nd line or extend appropriately (simplified for now)
    return lines.join("\n- ");
}

export function improvePlanText({
  title,
  nights,
  people,
  planText,
  foods = [],
  stays = [],
  theme = 'default', 
  category = 'traffic',
  detail = null // New param: detail metadata
}) {
  const base = planText?.trim() || "";

  // 1. Header with Mood
  const moodEmoji = { activity: '🏃‍♂️', healing: '🌿', food: '🍱' }[theme] || '✈️';
  const header = [
    `# ${moodEmoji} ${title} ${nights}박 ${people}인 여행 플랜`,
    `> 테마: ${theme.toUpperCase()} | 스타일: ${category === 'traffic' ? '드라이브 🚗' : '도보 산책 🚶'}`,
    "",
    `## ✨ 핵심 추천`,
    stays.length ? `- 숙소: ${stays.slice(0, 2).map(s => s.title).join(", ")}` : `- 숙소: 미정 (근처 ${theme === 'healing' ? '조용한 호텔' : '가성비 숙소'} 추천)`,
    foods.length ? `- 맛집: ${foods.slice(0, 2).map(f => f.title).join(", ")}` : `- 맛집: 미정 (현지인이 찾는 곳 위주)`,
    "",
  ].join("\n");

  // 2. Dynamic Template
  const templateBody = getTemplateLines(theme, nights);
  
  // 3. AI Insight from Detail Data (Mocking AI Analysis)
  let aiInsight = "";
  if (detail) {
      const overview = detail.overview ? detail.overview.replace(/<[^>]+>/g, '').slice(0, 150) + "..." : "";
      const infoText = [];
      if (detail.restdate) infoText.push(`휴무일: ${detail.restdate}`);
      if (detail.usetime) infoText.push(`이용시간: ${detail.usetime}`);
      if (detail.parking) infoText.push(`주차: ${detail.parking}`);
      
      aiInsight = [
          `## 🕵️ AI 장소 분석`,
          `"${title}"에 대한 AI 분석 결과입니다:`,
          `> ${overview}`,
          infoText.length > 0 ? `\n**💡 방문 팁**: ${infoText.join(' / ')}` : "",
          ""
      ].join("\n");
  }

  const template = [
    "## 🗓️ 추천 일정",
    `- ${templateBody}`,
    "",
    "## ✅ 체크리스트",
    "- 교통: 이동 동선 재확인 (주차/대중교통)",
    "- 예산: 비상금 10% 추가 확보",
    `- 준비물: ${category === 'walk' ? '편안한 운동화, 물' : '차량용 충전기, 선글라스'}`,
    "",
  ].join("\n");

  const tips = suggestByKeywords(base)
    .map((x) => `- ${x}`)
    .join("\n");

  const tipBlock = tips
    ? `## 💡 AI 보완 팁\n${tips}\n\n`
    : "";

  const merged = [
    header,
    aiInsight, // Inserted here
    base ? `## ✍️ 내 메모\n${base}\n\n` : "",
    template,
    tipBlock,
  ].join("");

  return merged.trim();
}