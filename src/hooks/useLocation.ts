import { useState, useEffect, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export const useLocation = (consentGiven: boolean) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(() => {
    if (!consentGiven) {
      setError('Location access not permitted');
      return;
    }

    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
        };
        setLocation(locationData);
        setLoading(false);
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [consentGiven]);

  useEffect(() => {
    if (consentGiven) {
      getCurrentLocation();
      
      // Update location every 30 seconds if consent is given
      const interval = setInterval(getCurrentLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [consentGiven, getCurrentLocation]);

  return { location, error, loading, refreshLocation: getCurrentLocation };
};
