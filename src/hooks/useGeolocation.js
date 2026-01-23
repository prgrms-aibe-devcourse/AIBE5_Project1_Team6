import { useState, useEffect } from "react";

/**
 * Custom hook to get user's current location from navigator.geolocation
 * @returns { { location: { lat: number, lng: number } | null, error: string | null, isLoading: boolean } }
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });
      setIsLoading(false);
    };

    const handleError = (error) => {
      setError(error.message);
      setIsLoading(false);
    };

    // Request high accuracy for better results
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    requestLocation();
  }, []);

  const requestLocation = () => {
    setIsLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            setIsLoading(false);
        }, 
        (err) => {
            setError(err.message);
            setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { location, error, isLoading, requestLocation };
}
