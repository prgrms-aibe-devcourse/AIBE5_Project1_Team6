import { useQuery } from '@tanstack/react-query';
import { fetchCurrentWeatherByLatLon } from '../services/weather';

export const useWeather = (lat, lon) => {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchCurrentWeatherByLatLon(lat, lon),
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
};
