import { useEffect, useState, useRef } from 'react';

/**
 * Hook to initialize and manage Kakao Map.
 * @param {Object} options - Map options (center, level)
 * @returns {Object} { mapRef, map, kakao }
 */
export const useKakaoMap = (options = {}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    // Note: In a real app, API Key should be env var. Assuming index.html already has it or we load here.
    // For this context, checking if window.kakao exists is safer as it might be loaded in index.html
    
    const initMap = () => {
        const { kakao } = window;
        if (!kakao || !kakao.maps) return;

        kakao.maps.load(() => {
            const container = mapRef.current;
            if (!container) return; // Component unmounted

            // Avoid re-initialization if already created, but we might want to update center
            // For now, simpler is better.
            if (container.hasChildNodes()) return; 
            
            const defaultOptions = {
                center: new kakao.maps.LatLng(37.5665, 126.9780), // Seoul Hall
                level: 7,
                ...options
            };

            const mapInstance = new kakao.maps.Map(container, defaultOptions);
            setMap(mapInstance);
            setIsLoaded(true);
        });
    };

    if (window.kakao && window.kakao.maps) {
        initMap();
    } else {
        // Retry logic or wait for script load if we were loading it dynamically
        const interval = setInterval(() => {
            if (window.kakao && window.kakao.maps) {
                initMap();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }
  }, []);

  return { mapRef, map, isLoaded, kakao: window.kakao };
};
