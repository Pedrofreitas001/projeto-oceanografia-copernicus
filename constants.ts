import { Anomaly, OceanDataPoint } from './types';

// Helper para gerar timestamps atuais dinâmicos
const now = new Date();
const formatTimestamp = (minutesAgo: number) => {
  const date = new Date(now.getTime() - minutesAgo * 60000);
  return date.toISOString();
};

const formatTimestampForDisplay = (hoursAgo: number, minutesAgo: number = 0) => {
  const date = new Date(now.getTime() - (hoursAgo * 3600000 + minutesAgo * 60000));
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0].slice(0, 5);
};

export const RECENT_DATA: OceanDataPoint[] = [
  { id: '1', timestamp: formatTimestamp(0), latitude: -23.5, longitude: -45.2, temperature: 24.5, salinity: 35.2, status: 'normal' },
  { id: '2', timestamp: formatTimestamp(15), latitude: -24.0, longitude: -44.8, temperature: 24.3, salinity: 35.3, status: 'normal' },
  { id: '3', timestamp: formatTimestamp(30), latitude: -22.8, longitude: -45.5, temperature: 26.1, salinity: 34.9, status: 'warning' },
  { id: '4', timestamp: formatTimestamp(45), latitude: -23.1, longitude: -44.2, temperature: 23.9, salinity: 35.4, status: 'normal' },
  { id: '5', timestamp: formatTimestamp(60), latitude: -25.2, longitude: -46.1, temperature: 28.5, salinity: 34.1, status: 'critical' },
];

export const ANOMALIES: Anomaly[] = [
  {
    id: '1',
    type: 'temperature',
    severity: 'critical',
    value: 28.5,
    expected: 24.0,
    deviation: 4.5,
    location: { lat: -23.5, lon: -45.2, name: 'Santos Basin - St. 42' },
    timestamp: formatTimestamp(30),
    description: 'Sudden temperature spike detected in deep water sensors.'
  },
  {
    id: '2',
    type: 'salinity',
    severity: 'medium',
    value: 33.5,
    expected: 35.2,
    deviation: -1.7,
    location: { lat: -24.0, lon: -44.8, name: 'Shelf Break - Buoy 09' },
    timestamp: formatTimestamp(240), // 4 horas atrás
    description: 'Abnormal salinity drop suggesting potential sensor drift or freshwater influx.'
  },
  {
    id: '3',
    type: 'currents',
    severity: 'low',
    value: 1.8,
    expected: 0.5,
    deviation: 1.3,
    location: { lat: -22.8, lon: -43.1, name: 'Rio Coastal Zone' },
    timestamp: formatTimestamp(2880), // 2 dias atrás
    description: 'Current velocity slightly above seasonal average.'
  }
];

export const TEMP_TREND_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 23 + Math.random() * 2 + (i > 12 ? 1 : 0), // Slight trend up
  avg: 24
}));

export const SALINITY_DATA = [
  { name: 'Jan', value: 35.1 },
  { name: 'Feb', value: 35.3 },
  { name: 'Mar', value: 35.0 },
  { name: 'Apr', value: 34.8 },
  { name: 'May', value: 35.2 },
  { name: 'Jun', value: 35.5 },
  { name: 'Jul', value: 35.6 },
  { name: 'Aug', value: 35.4 },
  { name: 'Sep', value: 35.2 },
  { name: 'Oct', value: 35.1 },
  { name: 'Nov', value: 34.9 },
  { name: 'Dec', value: 35.2 },
];
