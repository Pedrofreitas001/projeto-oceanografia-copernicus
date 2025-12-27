import { OceanDataPoint, Station, FilterRegion } from '../types';

/**
 * CONFIGURAÇÃO DA API
 * -------------------
 * O frontend está configurado para usar a API da Copernicus Marine Service.
 * Modos disponíveis:
 * 1. 'production': Usa a API serverless que conecta com Copernicus (credenciais no servidor)
 * 2. 'demo': Usa Open-Meteo API e dados mock para demonstração
 *
 * Configure VITE_API_MODE no .env.local ou nas variáveis de ambiente da Vercel
 */

const API_MODE = (import.meta as any).env?.VITE_API_MODE || 'demo';
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || '';
const USE_COPERNICUS = API_MODE === 'production';

// Open-Meteo endpoints (Free, No Key) - Usado no modo Demo
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';

interface BackendResponse {
  currentTemp: number;
  currentSalinity: number;
  currentChlorophyll: number;
  trend: Array<{ time: string; temp: number; avg: number }>;
}

// Mock Database of Stations
const STATIONS_DB: Station[] = [
  { id: 'B-01', name: 'Santos Basin Alpha', region: 'brazilian_coast', latitude: -24.0, longitude: -45.0, status: 'active' },
  { id: 'B-02', name: 'Rio Coastal Monitor', region: 'brazilian_coast', latitude: -23.0, longitude: -43.2, status: 'active' },
  { id: 'B-03', name: 'Florianópolis Shelf', region: 'brazilian_coast', latitude: -27.5, longitude: -48.4, status: 'active' },
  { id: 'SA-01', name: 'South Atlantic Deep', region: 'south_atlantic', latitude: -35.0, longitude: -20.0, status: 'active' },
  { id: 'SA-02', name: 'Tristan da Cunha Node', region: 'south_atlantic', latitude: -37.1, longitude: -12.3, status: 'maintenance' },
  { id: 'PA-01', name: 'Pacific Reference', region: 'pacific', latitude: -30.0, longitude: -90.0, status: 'active' },
];

export const OceanService = {
  
  /**
   * Retorna lista de estações filtrada por região
   */
  async getStations(region: FilterRegion = 'all'): Promise<Station[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (region === 'all') return STATIONS_DB;
    return STATIONS_DB.filter(s => s.region === region);
  },

  /**
   * Busca dados agregados para o Dashboard Principal
   * Agora aceita coordenadas para buscar dados específicos da estação selecionada
   */
  async getDashboardData(lat: number = -24.0, lon: number = -45.0): Promise<BackendResponse> {
    try {
      // MODO PRODUÇÃO: Usa API Serverless da Copernicus
      if (USE_COPERNICUS) {
        const copernicusUrl = BACKEND_URL
          ? `${BACKEND_URL}/copernicus`
          : '/api/copernicus';

        const res = await fetch(`${copernicusUrl}?lat=${lat}&lon=${lon}`);

        if (!res.ok) {
          console.warn('Copernicus API error, falling back to demo mode');
          throw new Error('Copernicus API unavailable');
        }

        const copernicusData = await res.json();

        // Transformar dados da Copernicus para o formato do dashboard
        const baseTemp = copernicusData.data.temperature || 24.5;
        const trendData = Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          const diurnalCycle = Math.sin((hour - 14) * Math.PI / 12) * 0.8;
          return {
            time: `${i}:00`,
            temp: Number((baseTemp + diurnalCycle).toFixed(1)),
            avg: Number(baseTemp.toFixed(1))
          };
        });

        return {
          currentTemp: copernicusData.data.temperature || 24.5,
          currentSalinity: copernicusData.data.salinity || 35.2,
          currentChlorophyll: copernicusData.data.chlorophyll || 0.42,
          trend: trendData
        };
      }

      // MODO DEMO: Integração Direta com Open-Meteo (Fallback)
      // Tenta buscar dados reais de ondas e correntes, e SST se disponivel
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'ocean_current_velocity',
        hourly: 'wave_height,ocean_current_velocity,wave_direction', 
        timezone: 'GMT',
        forecast_days: '1'
      });

      const response = await fetch(`${MARINE_API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error('External API unavailable');
      
      const data = await response.json();
      
      // Transformação de Dados (ETL no Frontend para Demo)
      
      // Temperatura baseada na latitude (mais frio ao sul)
      // Ajuste fino: Se latitude > 0 (norte) ou < 0 (sul)
      const baseTemp = 27 - (Math.abs(lat) * 0.6); 
      
      const trendData = data.hourly.time.slice(0, 24).map((time: string, i: number) => {
        const hour = parseInt(time.split('T')[1].split(':')[0]);
        // Ciclo diurno simulado
        const diurnalCycle = Math.sin((hour - 14) * Math.PI / 12) * 0.8; 
        
        // Se a API retornar dados reais de onda, usamos como variação de "ruído" nos dados
        const realDataNoise = (data.hourly.wave_height?.[i] || 0) * 0.5;
        
        return {
          time: time.split('T')[1],
          temp: Number((baseTemp + diurnalCycle + realDataNoise).toFixed(1)),
          avg: Number(baseTemp.toFixed(1))
        };
      });

      return {
        currentTemp: trendData[new Date().getHours()]?.temp || baseTemp,
        currentSalinity: 35.2 + (Math.random() * 0.2 - 0.1) + (lat < -30 ? -0.8 : 0), 
        currentChlorophyll: Math.abs(lon) > 40 ? 0.45 + (Math.random() * 0.15) : 0.15, 
        trend: trendData
      };

    } catch (error) {
      console.warn("API Error (Using cached/mock data):", error);
      return {
        currentTemp: 24.5,
        currentSalinity: 35.2,
        currentChlorophyll: 0.42,
        trend: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          temp: 24,
          avg: 24
        }))
      };
    }
  },

  /**
   * Busca medições recentes de boias específicas
   */
  async getRecentMeasurements(): Promise<OceanDataPoint[]> {
    if (!USE_DEMO_FALLBACK) {
      const res = await fetch(`${BACKEND_URL}/ocean/measurements`);
      return await res.json();
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const now = new Date();
    // Gera dados baseados nas estações mockadas
    return STATIONS_DB.slice(0, 5).map((station, i) => ({
      id: station.id,
      timestamp: new Date(now.getTime() - i * 15 * 60000).toISOString(),
      latitude: station.latitude,
      longitude: station.longitude,
      temperature: (24 + (Math.random() * 4 - 2) - (Math.abs(station.latitude) * 0.1)),
      salinity: 35 + (Math.random() * 1 - 0.5),
      chlorophyll: 0.4 + (Math.random() * 0.2),
      status: i === 2 ? 'warning' : i === 4 ? 'critical' : 'normal'
    }));
  }
};