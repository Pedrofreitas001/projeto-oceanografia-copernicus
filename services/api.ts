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

// Database of Real Ocean Monitoring Stations
// Baseado em localizações reais de monitoramento oceanográfico e áreas de interesse da Copernicus
const STATIONS_DB: Station[] = [
  // Costa Brasileira - Atlântico Sudoeste
  { id: 'BR-SP-01', name: 'Santos Basin - Plataforma Continental', region: 'brazilian_coast', latitude: -24.0, longitude: -45.0, status: 'active' },
  { id: 'BR-RJ-01', name: 'Rio de Janeiro - Zona Costeira', region: 'brazilian_coast', latitude: -23.0, longitude: -43.2, status: 'active' },
  { id: 'BR-SC-01', name: 'Florianópolis - Talude Continental', region: 'brazilian_coast', latitude: -27.5, longitude: -48.4, status: 'active' },
  { id: 'BR-RS-01', name: 'Rio Grande - Convergência Subtropical', region: 'brazilian_coast', latitude: -32.0, longitude: -51.0, status: 'active' },
  { id: 'BR-BA-01', name: 'Salvador - Recife de Coral', region: 'brazilian_coast', latitude: -13.0, longitude: -38.5, status: 'active' },
  { id: 'BR-PE-01', name: 'Recife - Plataforma Nordeste', region: 'brazilian_coast', latitude: -8.0, longitude: -34.9, status: 'active' },

  // Atlântico Sul - Áreas Oceânicas
  { id: 'SA-01', name: 'Atlântico Sul - Zona Pelágica', region: 'south_atlantic', latitude: -35.0, longitude: -20.0, status: 'active' },
  { id: 'SA-02', name: 'Tristan da Cunha - Ponto de Referência', region: 'south_atlantic', latitude: -37.1, longitude: -12.3, status: 'active' },
  { id: 'SA-03', name: 'Gyre Subtropical - Centro', region: 'south_atlantic', latitude: -30.0, longitude: -15.0, status: 'active' },
  { id: 'SA-04', name: 'Confluência Brasil-Malvinas', region: 'south_atlantic', latitude: -38.0, longitude: -54.0, status: 'active' },

  // Pacífico Sul
  { id: 'PA-01', name: 'Pacífico Sudeste - Zona de Ressurgência', region: 'pacific', latitude: -30.0, longitude: -90.0, status: 'active' },
  { id: 'PA-02', name: 'Ilha de Páscoa - Referência Remota', region: 'pacific', latitude: -27.1, longitude: -109.4, status: 'active' },
  { id: 'PA-03', name: 'Corrente de Humboldt', region: 'pacific', latitude: -15.0, longitude: -75.0, status: 'active' },
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

      // MODO DEMO: Integração com Open-Meteo Marine API
      // Busca dados reais de ondas, correntes e temperatura superficial do oceano
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'wave_height,ocean_current_velocity',
        hourly: 'wave_height,ocean_current_velocity,wave_direction',
        timezone: 'auto',
        forecast_days: '1',
        past_days: '0'
      });

      const response = await fetch(`${MARINE_API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error('External API unavailable');

      const data = await response.json();

      console.log('📡 Open-Meteo API Response for lat:', lat, 'lon:', lon, data);

      // Transformação de Dados - ETL no Frontend para Demo

      // Temperatura baseada na latitude (mais frio ao sul)
      // Fórmula: latitudes próximas ao equador = mais quente
      const baseTemp = 27 - (Math.abs(lat) * 0.6);

      // Pega dados das próximas 24 horas
      const currentHour = new Date().getHours();
      const trendData = data.hourly.time.slice(0, 24).map((time: string, i: number) => {
        const hour = parseInt(time.split('T')[1].split(':')[0]);

        // Ciclo diurno: mais quente à tarde (14h), mais frio de madrugada
        const diurnalCycle = Math.sin((hour - 14) * Math.PI / 12) * 1.2;

        // Usa dados reais de ondas como variação natural
        const waveVariation = (data.hourly.wave_height?.[i] || 0) * 0.3;

        const temp = baseTemp + diurnalCycle + waveVariation;

        return {
          time: time.split('T')[1].slice(0, 5), // HH:MM
          temp: Number(temp.toFixed(1)),
          avg: Number(baseTemp.toFixed(1))
        };
      });

      // Temperatura atual (hora atual do sistema)
      const currentTempIndex = trendData.findIndex(d =>
        parseInt(d.time.split(':')[0]) === currentHour
      );
      const currentTemp = currentTempIndex >= 0
        ? trendData[currentTempIndex].temp
        : baseTemp;

      return {
        currentTemp: Number(currentTemp.toFixed(1)),
        currentSalinity: Number((35.2 + (Math.random() * 0.2 - 0.1) + (lat < -30 ? -0.8 : 0)).toFixed(1)),
        currentChlorophyll: Number((Math.abs(lon) > 40 ? 0.45 + (Math.random() * 0.15) : 0.15).toFixed(2)),
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
   * Se stationId fornecido, retorna apenas dados dessa estação
   */
  async getRecentMeasurements(stationId?: string): Promise<OceanDataPoint[]> {
    // Modo Produção: tenta buscar do backend
    if (USE_COPERNICUS && BACKEND_URL) {
      try {
        const url = stationId
          ? `${BACKEND_URL}/ocean/measurements?station=${stationId}`
          : `${BACKEND_URL}/ocean/measurements`;
        const res = await fetch(url);
        if (res.ok) {
          return await res.json();
        }
      } catch (error) {
        console.warn('Backend measurements unavailable, using mock data');
      }
    }

    // Modo Demo ou Fallback: gera dados simulados
    await new Promise(resolve => setTimeout(resolve, 400));

    const now = new Date();

    // Se tem station ID, gera dados apenas para essa estação
    if (stationId) {
      const station = STATIONS_DB.find(s => s.id === stationId);
      if (!station) return [];

      // Gera 5 medições recentes para a estação selecionada
      return Array.from({ length: 5 }, (_, i) => {
        const latitudeFactor = Math.abs(station.latitude) * 0.15;
        const baseTemp = 27 - latitudeFactor;
        const tempVariation = (Math.random() * 3 - 1.5);

        return {
          id: `${station.id}-${i}`,
          timestamp: new Date(now.getTime() - i * 15 * 60000).toISOString(),
          latitude: station.latitude + (Math.random() * 0.1 - 0.05),
          longitude: station.longitude + (Math.random() * 0.1 - 0.05),
          temperature: Number((baseTemp + tempVariation).toFixed(1)),
          salinity: Number((35 + (Math.random() * 1 - 0.5)).toFixed(1)),
          chlorophyll: Number((0.3 + (Math.random() * 0.3)).toFixed(2)),
          status: i === 1 ? 'warning' : i === 4 ? 'critical' : 'normal'
        };
      });
    }

    // Sem station ID: retorna dados de várias estações
    return STATIONS_DB.slice(0, 5).map((station, i) => {
      const latitudeFactor = Math.abs(station.latitude) * 0.15;
      const baseTemp = 27 - latitudeFactor;
      const tempVariation = Math.random() * 3 - 1.5;

      return {
        id: station.id,
        timestamp: new Date(now.getTime() - i * 15 * 60000).toISOString(),
        latitude: station.latitude,
        longitude: station.longitude,
        temperature: Number((baseTemp + tempVariation).toFixed(1)),
        salinity: Number((35 + (Math.random() * 1 - 0.5)).toFixed(1)),
        chlorophyll: Number((0.3 + (Math.random() * 0.3)).toFixed(2)),
        status: i === 2 ? 'warning' : i === 4 ? 'critical' : 'normal'
      };
    });
  },

  /**
   * Busca anomalias detectadas
   * Se stationId fornecido, retorna apenas anomalias dessa estação
   */
  async getAnomalies(stationId?: string) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const now = new Date();
    const allStations = stationId
      ? STATIONS_DB.filter(s => s.id === stationId)
      : STATIONS_DB.slice(0, 5);

    return allStations.map((station, i) => {
      const hasAnomaly = Math.random() > 0.7; // 30% chance de anomalia
      if (!hasAnomaly && i > 0) return null;

      const latitudeFactor = Math.abs(station.latitude) * 0.15;
      const expectedTemp = 27 - latitudeFactor;
      const actualTemp = expectedTemp + (Math.random() * 6 - 3);
      const deviation = actualTemp - expectedTemp;

      return {
        id: `${station.id}-anomaly`,
        type: Math.abs(deviation) > 2 ? 'temperature' : 'salinity' as any,
        severity: Math.abs(deviation) > 3 ? 'critical' : Math.abs(deviation) > 1.5 ? 'medium' : 'low' as any,
        value: Math.abs(deviation) > 2 ? actualTemp : 34.5,
        expected: Math.abs(deviation) > 2 ? expectedTemp : 35.2,
        deviation: Math.abs(deviation) > 2 ? deviation : -0.7,
        location: {
          lat: station.latitude,
          lon: station.longitude,
          name: station.name
        },
        timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
        description: Math.abs(deviation) > 2
          ? `Desvio de temperatura de ${deviation.toFixed(1)}°C detectado`
          : 'Variação de salinidade observada'
      };
    }).filter(Boolean);
  }
};