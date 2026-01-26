/**
 * Reorders items to create a logical flow (e.g., Meal -> Dessert -> Meal).
 * @param {Array<any>} items - The ranked tour items.
 * @param {Array<string>} themes - The selected themes (e.g., ['food', 'healing']).
 */
export function sequenceRoute(items, themes = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
  
    // Only apply sequencing if "Food" is a selected theme
    if (!themes.includes('food')) {
      return items;
    }
  
    const dessertKeywords = ["카페", "베이커리", "디저트", "빙수", "tea", "coffee", "빵", "케이크"];
    
    // Helper to check if item is dessert/cafe
    const isDessert = (item) => {
      const text = `${item.title} ${item.cat3 || ''}`.toLowerCase();
      return dessertKeywords.some(k => text.includes(k.toLowerCase()));
    };
  
    const desserts = [];
    const mains = [];
  
    items.forEach(item => {
      if (isDessert(item)) {
        desserts.push(item);
      } else {
        mains.push(item);
      }
    });
  
    // Interleave: Main -> Dessert -> Main -> Dessert...
    const sequenced = [];
    let mIdx = 0;
    let dIdx = 0;
  
    while (mIdx < mains.length || dIdx < desserts.length) {
      if (mIdx < mains.length) {
        sequenced.push(mains[mIdx++]);
      }
      if (dIdx < desserts.length) {
        sequenced.push(desserts[dIdx++]);
      }
    }
  
    return sequenced;
  }
  
