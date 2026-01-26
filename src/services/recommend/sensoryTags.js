/**
 * Generates Wellness Sensory Tags based on content type and keywords.
 * Returns { noise, light, crowd } objects with { label, color, level 1-3 }.
 */
export function getSensoryTags(item) {
    const title = (item.title || "").toLowerCase();
    const type = Number(item.contenttypeid);

    // Default: Moderate
    let noise = { label: "보통 🔉", color: "#FFD700", level: 2 }; 
    let light = { label: "보통 💡", color: "#FFD700", level: 2 };
    let crowd = { label: "여유 🙂", color: "#4CAF50", level: 1 };

    // 1. Nature / Healing (Spot, Park)
    if (type === 12 || type === 25 || title.includes("숲") || title.includes("공원") || title.includes("산책")) {
        noise = { label: "조용함 🍃", color: "#4CAF50", level: 1 }; // ASMR
        light = { label: "자연광 ☀️", color: "#87CEEB", level: 2 };
        crowd = { label: "한적함 🧘", color: "#4CAF50", level: 1 };
    }

    // 2. Culture / Activity
    if (type === 14 || type === 28) {
        noise = { label: "활기참 🎶", color: "#FF9800", level: 3 };
        light = { label: "실내조명 💡", color: "#FFD700", level: 2 };
        crowd = { label: "적당함 👥", color: "#FFD700", level: 2 };
    }

    // 3. F&B / Market
    if (type === 39 || type === 38 || title.includes("시장")) {
        noise = { label: "시끌벅적 🗣️", color: "#FF5722", level: 3 };
        light = { label: "밝음 ✨", color: "#FF9800", level: 3 };
        crowd = { label: "붐빔 👨‍👩‍👧‍👦", color: "#FF5722", level: 3 };
    }

    // 4. Night Vibe
    if (title.includes("야경") || title.includes("밤")) {
        light = { label: "은은함 🌙", color: "#9C27B0", level: 1 };
        noise = { label: "감성적 🎵", color: "#9C27B0", level: 1 };
    }

    // 5. Library / Book
    if (title.includes("도서관") || title.includes("북")) {
        noise = { label: "침묵 🤫", color: "#607D8B", level: 0 };
    }

    return { noise, light, crowd };
}
