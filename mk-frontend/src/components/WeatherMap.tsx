'use client';

import { McKinneyBoundary } from './McKinneyBoundary';
import { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as d3 from 'd3';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { StormStatus, WeatherStation, WeatherResponse } from '@/types';

// Fix for default Leaflet icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom minimal marker icon
const createCustomIcon = (isSelected: boolean) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="
            width: ${isSelected ? '16px' : '12px'};
            height: ${isSelected ? '16px' : '12px'};
            background-color: ${isSelected ? '#ffffff' : '#3b82f6'};
            border: 2px solid ${isSelected ? '#3b82f6' : '#ffffff'};
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        "></div>`,
        iconSize: [isSelected ? 16 : 12, isSelected ? 16 : 12],
        iconAnchor: [isSelected ? 8 : 6, isSelected ? 8 : 6],
    });
};

interface VoronoiPolygon {
    station: WeatherStation;
    polygons: [number, number][][];
    color: string;
    rate: number;
}

// Helper to calculate average hourly rate based on time since midnight
const calculateHourlyRate = (station: WeatherStation) => {
    const precipTotal = station.imperial.precipTotal || 0;
    if (precipTotal <= 0) return 0;

    const obsTime = new Date(station.obsTimeLocal);
    const midnight = new Date(obsTime);
    midnight.setHours(0, 0, 0, 0);

    const diffMs = obsTime.getTime() - midnight.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes <= 0) return 0;

    return (precipTotal / diffMinutes) * 60;
};

// Helper to get color based on precipitation rate (100-Year Storm Thresholds)
const getRateColor = (rate: number) => {
    if (rate <= 0) return 'rgba(30, 41, 59, 0.2)'; // More transparent when no rain
    if (rate < 1.97) return 'rgba(56, 189, 248, 0.8)'; // < 1-Year
    if (rate < 2.12) return 'rgba(59, 130, 246, 0.8)'; // 1-Year
    if (rate < 2.69) return 'rgba(234, 179, 8, 0.8)'; // 2-Year
    if (rate < 3.12) return 'rgba(249, 115, 22, 0.8)'; // 5-Year
    if (rate < 3.67) return 'rgba(239, 68, 68, 0.9)'; // 10-Year
    if (rate < 4.07) return 'rgba(185, 28, 28, 0.9)'; // 25-Year
    if (rate < 4.48) return 'rgba(153, 27, 27, 0.95)'; // 50-Year
    return 'rgba(76, 5, 25, 1)'; // > 100-Year
};

interface WeatherMapProps {
    onStationSelect?: (stationId: string) => void;
    selectedStationId?: string | null;
    stationStatus?: StormStatus | null;
    isLoading?: boolean;
    error?: string | null;
    stations: WeatherStation[];
    cityGeoJson: any;
    onMapReady?: () => void;
}

export default function WeatherMap({
    onStationSelect,
    selectedStationId,
    stationStatus,
    isLoading,
    error,
    stations,
    cityGeoJson,
    onMapReady
}: WeatherMapProps) {
    // Center on McKinney, TX
    const center: [number, number] = [33.1972, -96.6397];

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Notify parent that map component is mounted
    useEffect(() => {
        if (onMapReady) {
            // Small timeout to ensure the map container is fully rendered visually
            const timer = setTimeout(() => {
                onMapReady();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [onMapReady]);

    // Component to handle map effects
    function MapEffect({ selectedStationId, stations }: { selectedStationId: string | null | undefined, stations: WeatherStation[] }) {
        const map = useMap();

        useEffect(() => {
            if (selectedStationId && stations.length > 0) {
                const station = stations.find(s => s.stationID === selectedStationId);
                if (station) {
                    map.setView([station.lat, station.lon], 14, {
                        animate: true,
                        duration: 1.5
                    });
                }
            }
        }, [selectedStationId, stations, map]);

        return null;
    }

    // Memoize the city boundary calculation separately so it doesn't run when stations update
    const cityBoundary = useMemo(() => {
        if (!cityGeoJson) return null;

        const MCKINNEY_ZIPS = new Set(['75069', '75070', '75071', '75072']);
        const relevantFeatures = cityGeoJson.features.filter((f: { properties: { ZIP_NO: string } }) =>
            MCKINNEY_ZIPS.has(f.properties.ZIP_NO)
        );

        if (relevantFeatures.length === 0) {
            console.warn('No matching zip codes found for clipping');
            return null;
        }

        // Union all zip codes to get the city outline
        try {
            let boundary = relevantFeatures[0];
            for (let i = 1; i < relevantFeatures.length; i++) {
                const unioned = turf.union(turf.featureCollection([boundary, relevantFeatures[i]]));
                if (unioned) boundary = unioned;
            }
            return boundary;
        } catch (e) {
            console.error("Error calculating city boundary:", e);
            return null;
        }
    }, [cityGeoJson]);

    // Calculate Voronoi Polygons
    const voronoiPolygons = useMemo(() => {
        if (stations.length === 0 || !cityBoundary) return [];

        try {
            // 1. Create a bounding box around the stations/city
            const minLat = Math.min(...stations.map(s => s.lat)) - 0.1;
            const maxLat = Math.max(...stations.map(s => s.lat)) + 0.1;
            const minLon = Math.min(...stations.map(s => s.lon)) - 0.1;
            const maxLon = Math.max(...stations.map(s => s.lon)) + 0.1;

            const delaunay = d3.Delaunay.from(
                stations,
                d => d.lat,
                d => d.lon
            );

            const voronoi = delaunay.voronoi([minLat, minLon, maxLat, maxLon]);

            return stations.map((station, i) => {
                const cell = voronoi.cellPolygon(i);
                if (!cell) return null;

                const turfPoints = cell.map(p => [p[1], p[0]]); // Swap to [lon, lat]
                if (turfPoints.length > 0 && (turfPoints[0][0] !== turfPoints[turfPoints.length - 1][0] || turfPoints[0][1] !== turfPoints[turfPoints.length - 1][1])) {
                    turfPoints.push(turfPoints[0]);
                }

                const voronoiPoly = turf.polygon([turfPoints]);
                const clipped = turf.intersect(turf.featureCollection([voronoiPoly, cityBoundary]));

                if (!clipped) return null;

                const polygons: [number, number][][] = [];

                if (clipped.geometry.type === 'Polygon') {
                    polygons.push(clipped.geometry.coordinates[0].map((p: number[]) => [p[1], p[0]]));
                } else if (clipped.geometry.type === 'MultiPolygon') {
                    clipped.geometry.coordinates.forEach((poly: number[][][]) => {
                        polygons.push(poly[0].map((p: number[]) => [p[1], p[0]]));
                    });
                }

                // Use the simplified hourly rate (or backend provided rate if we were fully connected)
                // For now, re-using the helper or we could expect it from `station.imperial.precipRate`?
                // The prompt implies we should color based on intensity. Weather Underground provides `precipRate`.
                // But `calculateHourlyRate` was using `precipTotal` over time.
                // Let's stick to `calculateHourlyRate` logic for now but applying the new COLORS.

                const rate = calculateHourlyRate(station);

                return {
                    station,
                    polygons,
                    color: getRateColor(rate),
                    rate
                };
            }).filter(Boolean) as VoronoiPolygon[];
        } catch (e) {
            console.error("Error calculating Voronoi polygons:", e);
            return [];
        }

    }, [stations, cityBoundary]);

    const selectedStation = stations.find(s => s.stationID === selectedStationId);

    return (
        <div className="w-full h-full relative group">
            <style jsx global>{`
                .leaflet-container {
                    background: transparent !important;
                    outline: 0 !important;
                }
                .leaflet-interactive:focus {
                    outline: none !important;
                }
                
                /* Light Mode (Default) - Force White Background and Black Text */
                .custom-popup .leaflet-popup-content-wrapper {
                    background: #ffffff !important;
                    color: #000000 !important;
                    border-radius: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .custom-popup .leaflet-popup-tip {
                    background: #ffffff !important;
                }
                .custom-popup .leaflet-popup-content {
                    margin: 0 !important;
                    line-height: 1.5;
                }

                /* Dark Mode Overrides */
                html.dark .custom-popup .leaflet-popup-content-wrapper {
                    background: #1e293b !important;
                    color: #f8fafc !important;
                }
                html.dark .custom-popup .leaflet-popup-tip {
                    background: #1e293b !important;
                }

                .custom-popup .leaflet-popup-close-button {
                    display: none;
                }
            `}</style>
            <MapContainer
                center={center}
                zoom={11}
                style={{ height: '100%', width: '100%', background: isDark ? '#0f172a' : '#f8fafc' }}
                className="z-0 outline-none"
                attributionControl={false}
                zoomControl={false}
            >
                <MapEffect selectedStationId={selectedStationId} stations={stations} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={isDark
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                />

                {/* Voronoi Zones */}
                {voronoiPolygons.map((poly, pIdx) => (
                    poly.polygons.map((positions, cIdx) => (
                        <Polygon
                            key={`poly-${poly.station.stationID}-${pIdx}-${cIdx}`}
                            positions={positions}
                            eventHandlers={{
                                click: () => {
                                    if (onStationSelect) {
                                        onStationSelect(poly.station.stationID);
                                    }
                                }
                            }}
                            pathOptions={{
                                fillColor: poly.color,
                                fillOpacity: 0.7,
                                weight: 2.2,
                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
                                className: "cursor-pointer"
                            }}
                        />
                    ))
                ))}

                <McKinneyBoundary show={true} data={cityGeoJson} />

                {/* Station Markers */}
                {stations.map((station) => {
                    const isSelected = selectedStationId === station.stationID;

                    return (
                        <Marker
                            key={station.stationID}
                            position={[station.lat, station.lon]}
                            icon={createCustomIcon(isSelected)}
                            eventHandlers={{
                                click: () => {
                                    if (onStationSelect) {
                                        onStationSelect(station.stationID);
                                    }
                                }
                            }}
                        />
                    );
                })}

                {/* Controlled Popup for Selected Station */}
                {selectedStation && (
                    <Popup
                        position={[selectedStation.lat, selectedStation.lon]}
                        eventHandlers={{
                            remove: () => onStationSelect?.('')
                        }}
                        className="custom-popup"
                        closeButton={false}
                        autoPan={true}
                        autoPanPadding={[50, 50]}
                    >
                        <div className="min-w-[280px] p-2">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-black dark:text-white">
                                    {selectedStation.stationID}
                                </h3>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                                    ${stationStatus?.alertLevel === 'Critical'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                    {isLoading ? '...' : (stationStatus?.alertLevel === 'Critical' ? 'Critical' : 'Normal')}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : error ? (
                                <div className="text-xs text-red-500 py-2">{error}</div>
                            ) : stationStatus ? (
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-black dark:text-white">
                                            {stationStatus.currentCategory}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                                            <div className="text-[10px] text-gray-700 dark:text-gray-300 uppercase">Intensity</div>
                                            <div className="text-sm font-mono font-semibold text-black dark:text-white">
                                                {stationStatus.maxIntensity.toFixed(2)}&quot;/hr
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                                            <div className="text-[10px] text-gray-700 dark:text-gray-300 uppercase">Duration</div>
                                            <div className="text-sm font-mono font-semibold text-black dark:text-white">
                                                {stationStatus.triggeringDuration}m
                                            </div>
                                        </div>
                                    </div>

                                    {/* Storm Severity Info */}
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                        <div className="text-[10px] text-gray-700 dark:text-gray-300 uppercase mb-1">Storm Severity</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${stationStatus.maxIntensity > 3.57 ? 'bg-red-900' :
                                                stationStatus.maxIntensity > 2.73 ? 'bg-red-600' :
                                                    stationStatus.maxIntensity > 2.35 ? 'bg-orange-500' :
                                                        stationStatus.maxIntensity > 1.85 ? 'bg-yellow-500' :
                                                            'bg-blue-500'
                                                }`}></div>
                                            <span className="text-xs font-medium text-black dark:text-white">
                                                {stationStatus.maxIntensity > 3.57 ? 'Emergency' :
                                                    stationStatus.maxIntensity > 2.73 ? 'High Priority' :
                                                        stationStatus.maxIntensity > 2.35 ? 'Medium' :
                                                            stationStatus.maxIntensity > 1.85 ? 'Moderate' :
                                                                'Light/Chill'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 text-center py-2">No data available</div>
                            )}
                        </div>
                    </Popup>
                )}
            </MapContainer>
        </div>
    );
}
