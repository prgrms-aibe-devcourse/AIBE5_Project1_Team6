
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// ✅ Fix Leaflet default icon issue in React/Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map updater to handle prop changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
    // Fix for map rendering issues (gray space or wrong center on init)
    const timeout = setTimeout(() => {
        map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [center, zoom, map]);
  return null;
}

export default function OSMMap({ lat, lon, title, style, className, zoom = 13, showMarker = true }) {
  const position = [lat, lon];
  const containerStyle = {
      width: "100%", 
      height: "240px", 
      marginTop: "16px", 
      borderRadius: "16px", 
      overflow: "hidden", 
      zIndex: 0,
      ...style 
  };

  return (
    <div className={className} style={containerStyle}>
      <MapContainer 
        center={position} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Only show marker if title is provided or if we assume single marker map */}
        {/* Only show marker if showMarker is true */}
        {showMarker && (
            <Marker position={position}>
              {title && (
                <Popup>
                    <span style={{ fontWeight: 600 }}>{title}</span>
                </Popup>
              )}
            </Marker>
        )}
        <MapUpdater center={position} zoom={zoom} />
      </MapContainer>
    </div>
  );
}
