export interface OceanDataPoint {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  temperature: number;
  salinity: number;
  chlorophyll?: number; // mg/m³ - Dados do Copernicus Biogeochemistry
  status: 'normal' | 'warning' | 'critical';
}

export interface Station {
  id: string;
  name: string;
  region: FilterRegion;
  latitude: number;
  longitude: number;
  status: 'active' | 'maintenance' | 'offline';
}

export interface Anomaly {
  id: string;
  type: 'temperature' | 'salinity' | 'currents' | 'biogeochem';
  severity: 'low' | 'medium' | 'critical';
  value: number;
  expected: number;
  deviation: number;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  timestamp: string;
  description: string;
}

export type ViewState = 'dashboard' | 'anomalies';
export type FilterRegion = 'all' | 'south_atlantic' | 'brazilian_coast' | 'pacific';