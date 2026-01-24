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
export function useTourDetail(contentId) {
    return useQuery({
        queryKey: TOUR_KEYS.detail(contentId),
        queryFn: async () => {
            const items = await fetchTourData('/detailCommon2', {
                contentId,
                overviewYN: 'Y',
                defaultYN: 'Y',
                firstImageYN: 'Y',
                addrinfoYN: 'Y',
                mapinfoYN: 'Y',
            });
            // The API returns an array, we usually want the first item for detail
            return items && items.length > 0 ? items[0] : null;
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
