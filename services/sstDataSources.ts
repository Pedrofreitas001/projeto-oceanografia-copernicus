// services/sstDataSources.ts
// Configuração de múltiplas fontes de dados SST com fallback automático

export interface SSTDataSource {
  id: string;
  name: string;
  type: 'wms' | 'wmts' | 'tiles';
  url: string;
  layers?: string;
  format?: string;
  attribution: string;
  maxZoom: number;
  minZoom: number;
  opacity: number;
  timeEnabled: boolean;
  resolution: string;
  updateFrequency: string;
  coverage: string;
  buildUrl: (date?: string) => string;
}

/**
 * NOAA nowCOAST - Tempo Real, Confiável
 * Resolução: 1/12° (~9km)
 * Atualização: Diária (04:00 UTC)
 */
export const NOAA_NOWCOAST: SSTDataSource = {
  id: 'noaa_nowcoast',
  name: 'NOAA nowCOAST SST Analysis',
  type: 'wms',
  url: 'https://nowcoast.noaa.gov/arcgis/services/nowcoast/analysis_ocean_sfc_sst_time/MapServer/WMSServer',
  layers: '1', // SST layer
  format: 'image/png',
  attribution: '© NOAA nowCOAST - NCEP NSST Analysis',
  maxZoom: 12,
  minZoom: 2,
  opacity: 0.7,
  timeEnabled: true,
  resolution: '1/12° (~9km)',
  updateFrequency: 'Diária (04:00 UTC)',
  coverage: 'Global + Grandes Lagos',

  buildUrl: (date?: string) => {
    const timeParam = date || new Date().toISOString().split('T')[0];
    return `https://nowcoast.noaa.gov/arcgis/services/nowcoast/analysis_ocean_sfc_sst_time/MapServer/WMSServer?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=1&STYLES=&FORMAT=image/png&TRANSPARENT=true&CRS=EPSG:3857&TIME=${timeParam}T00:00:00.000Z&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
  }
};

/**
 * NOAA CoralWatch CoralTemp - Histórico + Atual
 * Resolução: 5km (0.05°)
 * Dados: 1985-Presente
 */
export const NOAA_CORALWATCH: SSTDataSource = {
  id: 'noaa_coralwatch',
  name: 'NOAA Coral Reef Watch CoralTemp',
  type: 'wms',
  url: 'https://coastwatch.noaa.gov/erddap/wms/noaacrwsstDaily/request',
  layers: 'noaacrwsstDaily:analysed_sst',
  format: 'image/png',
  attribution: '© NOAA Coral Reef Watch - CoralTemp v3.1',
  maxZoom: 12,
  minZoom: 2,
  opacity: 0.7,
  timeEnabled: true,
  resolution: '5km (0.05°)',
  updateFrequency: 'Diária',
  coverage: 'Global (1985-presente)',

  buildUrl: (date?: string) => {
    const timeParam = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return `https://coastwatch.noaa.gov/erddap/wms/noaacrwsstDaily/request?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=noaacrwsstDaily:analysed_sst&STYLES=&FORMAT=image/png&TRANSPARENT=true&CRS=EPSG:3857&TIME=${timeParam}T00:00:00.000Z&COLORSCALERANGE=0,32&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
  }
};

/**
 * NASA GIBS - MODIS Aqua SST
 * Resolução: 4km
 * Near Real-Time (poucas horas de latência)
 */
export const NASA_GIBS_MODIS: SSTDataSource = {
  id: 'nasa_gibs_modis',
  name: 'NASA GIBS MODIS Aqua SST',
  type: 'wmts',
  url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
  layers: 'MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily',
  format: 'image/png',
  attribution: '© NASA EOSDIS GIBS - MODIS Aqua',
  maxZoom: 8,
  minZoom: 2,
  opacity: 0.7,
  timeEnabled: true,
  resolution: '4km',
  updateFrequency: 'Diária (poucas horas)',
  coverage: 'Global',

  buildUrl: (date?: string) => {
    const dateStr = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily/default/${dateStr}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
  }
};

/**
 * NOAA CoastWatch JPL MUR SST - Alta Resolução
 * Resolução: 0.01° (~1km)
 * Multi-scale Ultra-high Resolution
 */
export const NOAA_JPL_MUR: SSTDataSource = {
  id: 'noaa_jpl_mur',
  name: 'JPL MUR SST (Ultra-Alta Resolução)',
  type: 'wms',
  url: 'https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request',
  layers: 'jplMURSST41:analysed_sst',
  format: 'image/png',
  attribution: '© NOAA CoastWatch - JPL MUR SST',
  maxZoom: 12,
  minZoom: 2,
  opacity: 0.7,
  timeEnabled: true,
  resolution: '0.01° (~1km)',
  updateFrequency: 'Diária',
  coverage: 'Global (2002-presente)',

  buildUrl: (date?: string) => {
    const timeParam = date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return `https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=jplMURSST41:analysed_sst&STYLES=&FORMAT=image/png&TRANSPARENT=true&CRS=EPSG:3857&TIME=${timeParam}T00:00:00.000Z&COLORSCALERANGE=0,32&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
  }
};

// Lista de fontes em ordem de prioridade (fallback cascata)
export const SST_DATA_SOURCES: SSTDataSource[] = [
  NOAA_NOWCOAST,      // 1ª prioridade: Tempo real operacional
  NOAA_JPL_MUR,       // 2ª prioridade: Ultra-alta resolução
  NOAA_CORALWATCH,    // 3ª prioridade: Histórico confiável
  NASA_GIBS_MODIS,    // 4ª prioridade: Backup NASA
];

/**
 * Testa qual fonte de dados está disponível
 */
export async function testSSTDataSource(source: SSTDataSource): Promise<boolean> {
  try {
    const testUrl = source.type === 'wms'
      ? `${source.url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`
      : `${source.url}/1.0.0/WMTSCapabilities.xml`;

    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    return response.ok;
  } catch (error) {
    console.warn(`SST source ${source.id} unavailable:`, error);
    return false;
  }
}

/**
 * Retorna a primeira fonte disponível
 */
export async function getAvailableSSTSource(): Promise<SSTDataSource> {
  console.log('🔍 Testing SST data sources...');

  for (const source of SST_DATA_SOURCES) {
    const isAvailable = await testSSTDataSource(source);

    if (isAvailable) {
      console.log(`✅ Using SST source: ${source.name}`);
      return source;
    }
  }

  console.warn('⚠️ No SST source available, using default (JPL MUR)');
  return NOAA_JPL_MUR; // Fallback padrão
}
