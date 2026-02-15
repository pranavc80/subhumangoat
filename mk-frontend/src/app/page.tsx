'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';
import { StormStatus, WeatherStation, WeatherResponse } from '@/types';
import SettingsModal from '@/components/SettingsModal';
import WelcomeModal from '@/components/WelcomeModal';


// Loading Component
const LoadingScreen = () => (
  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#0f172a] select-none">
    <div className="text-center">
      <p className="text-sm font-bold tracking-[0.2em] animate-pulse bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-700 dark:to-blue-900 bg-clip-text text-transparent">
        INITIALIZING COGNISPHERE
      </p>
    </div>
  </div>
);

// Dynamically import WeatherMap with SSR disabled to prevent Leaflet issues
const WeatherMap = dynamic(() => import('@/components/WeatherMap'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [status, setStatus] = useState<StormStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Data for WeatherMap
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [cityGeoJson, setCityGeoJson] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Cache for station status: Map<stationId, StormStatus>
  const statusCache = useRef<Map<string, StormStatus>>(new Map());

  // Fetch Weather Data & GeoJSON (Moved from WeatherMap.tsx)
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const [weatherRes, zipRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/weather'),
          fetch('/data/Zip_Codes.json')
        ]);

        if (weatherRes.ok) {
          const weatherData: WeatherResponse = await weatherRes.json();
          setStations(weatherData.data);
        }

        if (zipRes.ok) {
          const zipData = await zipRes.json();
          setCityGeoJson(zipData);
        }

      } catch (err) {
        console.error('Failed to fetch map data:', err);
      }
    };

    fetchMapData();
    const interval = setInterval(fetchMapData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    if (!stationId) return;

    // Check cache first
    if (statusCache.current.has(stationId)) {
      setStatus(statusCache.current.get(stationId)!);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/status/${stationId}`);
      if (!response.ok) {
        let errorMessage = 'Failed to fetch status';
        try {
          const errorJson = await response.json();
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }

        // If station is not found in the monitoring system, treat it as Normal
        if (response.status === 404 || errorMessage === 'Station not found') {
          const normalStatus: StormStatus = {
            currentCategory: 'Normal',
            maxIntensity: 0,
            triggeringDuration: 0,
            alertLevel: 'None'
          };
          setStatus(normalStatus);
          // Cache the normal status too
          statusCache.current.set(stationId, normalStatus);
          return;
        }

        throw new Error(errorMessage);
      }
      const data = await response.json();
      setStatus(data);
      // Update cache
      statusCache.current.set(stationId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) {
      fetchStatus();
    } else {
      setStatus(null);
      setError(null);
    }
  }, [stationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStationSelect = (id: string) => {
    setStationId(id);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white font-[family-name:var(--font-geist-sans)]">

      {/* Map Area (Background) */}
      <div className="absolute inset-0 z-0">
        <WeatherMap
          onStationSelect={handleStationSelect}
          selectedStationId={stationId}
          stationStatus={status}
          isLoading={loading}
          error={error}
          stations={stations}
          cityGeoJson={cityGeoJson}
          onMapReady={() => setIsMapReady(true)}
        />
      </div>

      {/* Loading Overlay (Blocks interaction until map is ready) */}
      {!isMapReady && <LoadingScreen />}

      {/* Settings Button (Replaces Theme Toggle) */}
      <div className={`transition-opacity duration-1000 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 left-4 z-50 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Welcome Modal for New Users */}
      <WelcomeModal
        isOpen={showWelcome && isMapReady}
        onClose={() => {
          setShowWelcome(false);
          localStorage.setItem('hasSeenWelcome', 'true');
        }}
      />


    </div>
  );
}
