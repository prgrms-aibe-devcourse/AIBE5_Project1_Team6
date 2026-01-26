/**
 * Generates a consistent random number (0~1) based on a numeric seed.
 * logic: simple sin hash
 */
function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

/**
 * Returns a varied price based on content ID to make it look "dynamic" but consistent.
 * @param {number} base - Base price
 * @param {string|number} id - Content ID (seed)
 * @param {number} variance - Max variance ratio (e.g. 0.2 for +/- 20%)
 */
function getVariedPrice(base, id, variance = 0.2) {
    if (!base) return 0;
    const numId = Number(id) || 0;
    const noise = pseudoRandom(numId); // 0..1
    const factor = 1 + (noise * variance * 2 - variance); // 0.8 ~ 1.2
    
    // Round to nearest 100 won for realism
    return Math.round((base * factor) / 100) * 100;
}

/**
 * Heuristic Budget Estimator for Tour API Items.
 * Returns numeric cost estimates for calculation and display.
 */
export function estimateBudgetLevel(item) {
    if (!item) return { label: '정보 없음', color: 'gray', cost: 0 };

    const ct = Number(item.contenttypeid);
    const title = (item.title || '').toLowerCase();
    const id = item.contentid || 0;
    
    // 1. FREE Tier (Nature, Landscape, Parks)
    const freeKeywords = ['공원', '산', '해변', '강', '호수', '숲', '둘레길', '산책로', '전망대', '마을', '광장', '유원지'];
    if (ct === 12 || ct === 25) { 
        if (freeKeywords.some(k => title.includes(k))) {
            return { label: 'Free 🆓', color: 'green', cost: 0 };
        }
        // Even if nature, some might have small parking/entrance fees
        return { label: '관람 📷', color: 'green', cost: getVariedPrice(3000, id, 0.5) };
    }

    // 2. TICKET / PAID Tier (Culture, Activity, Performance)
    // Museum/Art: ~10,000 | Activity/ThemePark: ~30,000 | Festival: ~10,000
    if (ct === 14) return { label: '입장료 💵', color: 'blue', cost: getVariedPrice(12000, id, 0.3) };
    if (ct === 28) {
        // Golf/Ski/Large Activity might be expensive
        if (title.includes('골프') || title.includes('스키') || title.includes('요트')) 
             return { label: '액티비티 🎟️', color: 'blue', cost: getVariedPrice(80000, id, 0.2) };
             
        return { label: '체험비 🎟️', color: 'blue', cost: getVariedPrice(35000, id, 0.3) };
    }
    if (ct === 15) return { label: '참가비 🎉', color: 'blue', cost: getVariedPrice(10000, id, 0.5) };

    // 3. VARIABLE / FOOD Tier
    if (ct === 39) {
        if (title.includes('카페') || title.includes('커피') || title.includes('베이커리') || title.includes('디저트')) 
            return { label: '음료 ☕', color: 'orange', cost: getVariedPrice(7500, id, 0.3) };
            
        if (title.includes('스시') || title.includes('한우') || title.includes('뷔페') || title.includes('정식'))
            return { label: '식사 🍱', color: 'orange', cost: getVariedPrice(45000, id, 0.3) };
            
        if (title.includes('국수') || title.includes('김밥') || title.includes('떡볶이') || title.includes('해장국'))
            return { label: '식사 🍜', color: 'orange', cost: getVariedPrice(11000, id, 0.2) };

        // Default Meal
        return { label: '식사 🍚', color: 'orange', cost: getVariedPrice(18000, id, 0.25) };
    }
    
    // Shopping
    if (ct === 38) {
         if (title.includes('시장')) return { label: '쇼핑 🛍️', color: 'purple', cost: getVariedPrice(20000, id, 0.5) };
         return { label: '쇼핑 🛍️', color: 'purple', cost: getVariedPrice(50000, id, 0.4) }; 
    }

    // Lodging
    if (ct === 32) {
        if (title.includes('호텔') || title.includes('리조트')) 
             return { label: '숙박 🏨', color: 'red', cost: getVariedPrice(150000, id, 0.3) };
        if (title.includes('게스트하우스') || title.includes('민박'))
             return { label: '숙박 🏠', color: 'red', cost: getVariedPrice(60000, id, 0.2) };
             
        return { label: '숙박 🏠', color: 'red', cost: getVariedPrice(90000, id, 0.3) };
    }

    // Default Fallback
    return { label: '기타', color: 'gray', cost: getVariedPrice(10000, id, 0.5) };
}

/**
 * Calculates total item cost including context (people).
 */
export function estimateItemCost(item, people = 1, nights = 1) {
    const raw = estimateBudgetLevel(item);
    
    // Lodging: Unit Cost * Nights
    if (raw.label.includes('숙박')) return raw.cost * nights; 
    
    // Food/Ticket/Activity: Per Person
    return raw.cost * people;
}

/**
 * Calculates total cost for a list of items
 */
export function getCourseCost(items, people = 1, nights = 1) {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + estimateItemCost(item, people, nights), 0);
}
