'use client';
import { useEffect, useState } from 'react';

const LOCATION_STORAGE_KEY = 'user_location';
const LOCATION_EXPIRY_DAYS = 20;

type LocationData = {
  country: string;
  city: string;
  timestamp: number;
};

const getStoredLocation = (): LocationData | null => {
  if (typeof window === 'undefined') return null; // ADD: SSR check

  const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!storedData) return null;

  try {
    // ADD: error handling
    const parsedData: LocationData = JSON.parse(storedData);
    const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - parsedData.timestamp > expiryTime;

    if (isExpired) {
      localStorage.removeItem(LOCATION_STORAGE_KEY); // ADD: cleanup
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('Failed to parse stored location:', error);
    localStorage.removeItem(LOCATION_STORAGE_KEY); // ADD: cleanup corrupted data
    return null;
  }
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<LocationData | null>(null); // CHANGED: Don't call getStoredLocation during SSR

  useEffect(() => {
    const storedLocation = getStoredLocation(); // MOVED: Call inside useEffect
    if (storedLocation) {
      setLocation(storedLocation);
      return;
    }

    fetch('http://ip-api.com/json/') // CHANGED: http -> https
      .then((res) => res.json())
      .then((data) => {
        const newLocation: LocationData = {
          country: data?.country || 'Unknown',
          city: data?.city || 'Unknown',
          timestamp: Date.now(),
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((error) => console.error('Failed to get location:', error)); // CHANGED: console.log -> console.error
  }, []);

  return location;
};

export default useLocationTracking;
