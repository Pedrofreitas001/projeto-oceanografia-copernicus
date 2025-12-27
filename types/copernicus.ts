// types/copernicus.ts
// Tipos TypeScript para integração com Copernicus Marine Service

export type Season = 'summer' | 'autumn' | 'winter' | 'spring';
export type Hemisphere = 'north' | 'south';

export type VariableId = 'thetao' | 'so' | 'uo' | 'vo' | 'zos' | 'mlotst';

export type Colormap =
  | 'thermal' | 'haline' | 'speed' | 'dense' | 'ice'
  | 'balance' | 'viridis' | 'plasma' | 'rainbow' | 'gray' | 'turbo';

export interface Variable {
  id: VariableId;
  name: string;
  unit: string;
  colormap: Colormap;
  range: [number, number];
  datasetId: string;
}

export interface WMTSParams {
  layer: string;
  tileMatrixSet: string;
  time?: string;
  elevation?: number;
  style?: string;
}

export interface SeasonDateRange {
  start: { month: number; day: number };
  end: { month: number; day: number };
}

export interface FeatureInfoResult {
  value: number | null;
  unit: string;
  time: string;
  coordinates: { lat: number; lon: number };
}

export interface MapState {
  variableId: VariableId;
  time: string;
  elevation: number;
  season: Season | null;
  hemisphere: Hemisphere;
}
