import { useEffect, useRef } from 'react';

export default function TripMap({ lat, lon, title }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lon) return;

    const initMap = () => {
        const { kakao } = window;
        if (!kakao || !kakao.maps) {
            return false;
        }

        kakao.maps.load(() => {
            // Re-check ref just in case
            if(!mapRef.current) return;
            
            // Clear previous map if needed
            mapRef.current.innerHTML = '';

            const position = new kakao.maps.LatLng(lat, lon);
            const options = {
                center: position,
                level: 3
            };

            const map = new kakao.maps.Map(mapRef.current, options);
            
            const marker = new kakao.maps.Marker({
                position: position
            });
            marker.setMap(map);
            
            if (title) {
                const infowindow = new kakao.maps.InfoWindow({
                    content: `<div style="padding:5px; color:black;">${title}</div>`
                });
                // Optional: infowindow.open(map, marker);
            }
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

  if (!lat || !lon) return null;

  return (
    <div 
        ref={mapRef} 
        style={{
            width: '100%',
            height: '240px',
            borderRadius: '16px',
            marginTop: '16px',
            backgroundColor: '#333' // 로딩 전 배경
        }}
    />
  );
}
