import { useQuery } from '@tanstack/react-query';
import { fetchTourData } from '../../api/tourApi';

// Keys for caching
export const TOUR_KEYS = {
  all: ['tour'],
  list: (params) => [...TOUR_KEYS.all, 'list', params],
  location: (params) => [...TOUR_KEYS.all, 'location', params],
  detail: (contentId) => [...TOUR_KEYS.all, 'detail', contentId],
};

/**
 * Hook to fetch area-based tour list
 * @param {object} params - API parameters (contentTypeId, areaCode, sigunguCode, etc.)
 */
export function useTourList(params) {
  return useQuery({
    queryKey: TOUR_KEYS.list(params),
    queryFn: () => fetchTourData('/areaBasedList2', {
      numOfRows: 20,
      pageNo: 1,
      arrange: 'Q', // Q=Modified Date, O=Title, P=View Count
      ...params
    }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to search keywords
 * @param {string} keyword 
 */
export function useTourSearch(keyword) {
    return useQuery({
        queryKey: [...TOUR_KEYS.all, 'search', keyword],
        queryFn: () => fetchTourData('/searchKeyword2', {
            keyword,
            numOfRows: 20,
            arrange: 'Q',
            contentTypeId: 12, // 12=Tourist Spot
        }),
        enabled: !!keyword,
    });
}

/**
 * Hook to fetch detail info (overview, images, etc.)
 * @param {string|number} contentId 
 */
// Helper to normalize TourAPI's inconsistent field names
function normalizeIntro(item, contentTypeId) {
    if (!item) return {};
    const type = Number(contentTypeId);
    let norm = { ...item }; // Keep original fields too

    // Helper getters
    const get = (...keys) => {
        for (const k of keys) {
            if (item[k]) return item[k];
        }
        return null;
    };

    // 1. Parking
    norm.parking = get('parking', 'parkingfood', 'parkinglodging', 'parkingculture', 'parkingshopping', 'parkingleports');
    
    // 2. Rest Date
    norm.restdate = get('restdate', 'restdatefood', 'restdateculture', 'restdateshopping', 'restdateleports');
    
    // 3. Use Time / Open Time
    if (type === 32) { // Stay
        const inTime = item.checkintime || '';
        const outTime = item.checkouttime || '';
        norm.usetime = `입실 ${inTime} / 퇴실 ${outTime}`;
    } else {
        norm.usetime = get('usetime', 'opentimefood', 'usetimeculture', 'opentime', 'usetimeleports', 'playtime');
    }
    
    // 4. Info Center (This often comes from Common, but sometimes Intro has specific)
    // Common has 'tel', Intro might have 'infocenter'
    norm.infocenter = get('infocenter', 'infocenterfood', 'infocenterculture', 'infocenterleports', 'infocentershopping');

    return norm;
}

export function useTourDetail(contentId, contentTypeId) {
    return useQuery({
        queryKey: TOUR_KEYS.detail(contentId),
        queryFn: async () => {
            if (!contentId) return null;

            // 1. Fetch Common Info
            const commonPromise = fetchTourData('/detailCommon2', {
                contentId,
                overviewYN: 'Y',
                defaultYN: 'Y',
                firstImageYN: 'Y',
                addrinfoYN: 'Y',
                mapinfoYN: 'Y',
            });

            // 2. Fetch Intro Info
            let introPromise = Promise.resolve([]);
            if (contentTypeId) {
                introPromise = fetchTourData('/detailIntro2', {
                    contentId,
                    contentTypeId,
                });
            }

            const [commonItems, introItems] = await Promise.all([commonPromise, introPromise]);
            
            const common = commonItems && commonItems.length > 0 ? commonItems[0] : {};
            const introRaw = introItems && introItems.length > 0 ? introItems[0] : {};
            
            // Normalize Intro Data
            const intro = normalizeIntro(introRaw, contentTypeId);

            // Merge: Intro should override if field exists, but we normalized unique keys.
            // Also prioritize Common's tel if Intro's infocenter is missing
            const merged = { ...common, ...intro };
            if (!merged.infocenter && merged.tel) merged.infocenter = merged.tel;
            
            return merged;
        },
        enabled: !!contentId,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 30, // 30 mins
    });
}

/**
 * Hook to fetch location-based tour list
 * @param {object} params - { mapX, mapY, radius, contentTypeId, etc. }
 */
export function useLocationBasedTour(params) {
    const { mapX, mapY, radius } = params;
    return useQuery({
        queryKey: TOUR_KEYS.location(params),
        queryFn: () => fetchTourData('/locationBasedList2', {
            arrange: 'E', // E=Distance, Q=Modified, O=Title
            numOfRows: 20,
            pageNo: 1,
            ...params
        }),
        // Only fetch if we have coordinates
        enabled: !!mapX && !!mapY && !!radius,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
