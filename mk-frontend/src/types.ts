export interface StormStatus {
    currentCategory: '100-Year' | 'Normal';
    maxIntensity: number;
    triggeringDuration: number;
    alertLevel: 'None' | 'Critical';
}

export interface IngestResponse {
    success: boolean;
    status: StormStatus;
}

export interface WeatherStation {
    stationID: string;
    obsTimeUtc: string;
    obsTimeLocal: string;
    neighborhood: string;
    lat: number;
    lon: number;
    humidity: number;
    imperial: {
        temp: number;
        heatIndex: number;
        dewpt: number;
        windChill: number;
        windSpeed: number;
        windGust: number;
        pressure: number;
        precipRate: number | null;
        precipTotal: number;
        elev: number;
    };
}

export interface WeatherResponse {
    data: WeatherStation[];
    cached: boolean;
    timestamp: number;
    stations: number;
    responseTime: number;
}
