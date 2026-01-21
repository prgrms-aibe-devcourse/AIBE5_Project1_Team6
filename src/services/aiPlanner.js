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

export function improvePlanText({
  title,
  nights,
  people,
  planText,
  foods = [],
  stays = [],
}) {
  const base = planText?.trim() || "";

  const header = [
    `# ${title} 여행 플랜 (권장 ${Math.max(1, nights)}박 / ${Math.max(1, people)}명)`,
    "",
    `## 핵심 추천`,
    stays.length ? `- 숙소 후보: ${stays.slice(0, 2).map(s => s.title).join(" / ")}` : `- 숙소 후보: (선택 필요)`,
    foods.length ? `- 대표 음식: ${foods.slice(0, 2).map(f => f.title).join(" / ")}` : `- 대표 음식: (선택 필요)`,
    "",
  ].join("\n");

  const template = [
    "## 일정 템플릿",
    `- 1일차: 도착 → 체크인 → 근처 산책/야경 → 저녁`,
    nights >= 2 ? `- 2일차: 핵심 관광 2~3곳 → 맛집/카페 → 야경` : null,
    nights >= 3 ? `- 3일차: 느긋한 브런치 → 쇼핑/기념품 → 이동` : null,
    "",
    "## 체크리스트",
    "- 교통: 공항/역 ↔ 숙소 이동 수단 확인",
    "- 예산: 교통/식비/입장료/쇼핑 분리",
    "- 준비물: 상비약/보조배터리/우산(또는 우비)",
    "",
  ].filter(Boolean).join("\n");

  const tips = suggestByKeywords(base)
    .map((x) => `- ${x}`)
    .join("\n");

  const tipBlock = tips
    ? `## AI 보완 팁\n${tips}\n\n`
    : "";

  const merged = [
    header,
    base ? `## 내 메모\n${base}\n\n` : "",
    template,
    tipBlock,
  ].join("");

  return merged.trim();
}