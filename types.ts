export interface OceanDataPoint {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  temperature: number;
  salinity: number;
  chlorophyll?: number;
  status: 'normal' | 'warning' | 'critical';
}

/** Estação NDBC com dados da última medição (vem do RPC get_stations_with_latest) */
export interface Station {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  region: string;
  station_type: string;
  is_active: boolean;
  // Última medição (join lateral)
  observed_at?: string;
  wave_height?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  water_temp?: number | null;
  air_temp?: number | null;
  pressure?: number | null;
}

/** Medição de série temporal (vem do RPC get_station_timeseries) */
export interface Measurement {
  observed_at: string;
  wave_height: number | null;
  dominant_period: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gust: number | null;
  water_temp: number | null;
  air_temp: number | null;
  pressure: number | null;
  dewpoint: number | null;
}

export type ViewState = 'dashboard';
export type FilterRegion = 'all' | 'atlantic' | 'pacific' | 'gulf' | 'great_lakes';
