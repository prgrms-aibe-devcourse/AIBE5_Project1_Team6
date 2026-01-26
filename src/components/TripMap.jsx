import { useEffect, useRef } from 'react';
import OSMMap from './OSMMap';

function KakaoStaticMap({ lat, lon, title }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return;

    const initMap = () => {
        const { kakao } = window;
        if (!kakao || !kakao.maps) {
            return false;
        }

        kakao.maps.load(() => {
            if(!mapRef.current) return;
            mapRef.current.innerHTML = ''; // Clear

            const position = new kakao.maps.LatLng(lat, lon);
            const options = {
                center: position,
                level: 5 // 약간 넓게
            };

            const map = new kakao.maps.Map(mapRef.current, options);
            
            const marker = new kakao.maps.Marker({
                position: position
            });
            marker.setMap(map);
            
            // InfoWindow is optional, keeping it simple for now
            // if (title) { ... }
        });
        return true;
    };

    if (!initMap()) {
         const intervalId = setInterval(() => {
            if (initMap()) {
                clearInterval(intervalId);
            }
        }, 500);
        return () => clearInterval(intervalId);
    }
  }, [lat, lon, title]);

  return (
    <div 
        ref={mapRef} 
        style={{
            width: '100%',
            height: '240px',
            borderRadius: '16px',
            marginTop: '16px',
            backgroundColor: '#f0f0f0'
        }}
    />
  );
}

export default function TripMap({ lat, lon, title }) {
  if (!lat || !lon) return null;

  // 🇰🇷 Simple Check for Korea Coordinates
  // Approx: Lat 33~39, Lon 124~132
  const isKorea = (lat >= 33 && lat <= 39 && lon >= 124 && lon <= 132);

  if (isKorea) {
    return <KakaoStaticMap lat={lat} lon={lon} title={title} />;
  } else {
    return <OSMMap lat={lat} lon={lon} title={title} />;
  }
}
