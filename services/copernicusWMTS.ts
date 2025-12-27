// services/copernicusWMTS.ts
// Serviços para integração com Copernicus Marine WMTS

import { WMTS_BASE_URL, PRODUCT_ID, VARIABLES } from '../constants/datasets';
import { VariableId, FeatureInfoResult } from '../types/copernicus';

/**
 * Constrói URL de tile WMTS com parâmetros dinâmicos
 * Retorna uma URL template que o Leaflet pode usar
 */
export function buildWMTSTileUrl(params: {
  variableId: VariableId;
  time?: string;
  elevation?: number;
  style?: string;
}): string {
  const { variableId, time, elevation, style } = params;
  const variable = VARIABLES[variableId];

  const layer = `${PRODUCT_ID}/${variable.datasetId}`;
  const defaultStyle = `cmap:${variable.colormap},range:${variable.range[0]}/${variable.range[1]}`;

  const urlParams = new URLSearchParams({
    SERVICE: 'WMTS',
    REQUEST: 'GetTile',
    LAYER: layer,
    TILEMATRIXSET: 'EPSG:3857',
    TILEMATRIX: '{z}',
    TILEROW: '{y}',
    TILECOL: '{x}',
    FORMAT: 'image/png',
    STYLE: style || defaultStyle
  });

  if (time) urlParams.set('TIME', time);
  if (elevation !== undefined) urlParams.set('ELEVATION', elevation.toString());

  return `${WMTS_BASE_URL}?${urlParams.toString()}`;
}

/**
 * Busca informações de um ponto específico no mapa usando GetFeatureInfo
 */
export async function getFeatureInfo(params: {
  variableId: VariableId;
  lat: number;
  lon: number;
  time?: string;
  elevation?: number;
}): Promise<FeatureInfoResult> {
  const { variableId, lat, lon, time, elevation } = params;
  const variable = VARIABLES[variableId];

  const layer = `${PRODUCT_ID}/${variable.datasetId}`;

  const urlParams = new URLSearchParams({
    SERVICE: 'WMTS',
    REQUEST: 'GetFeatureInfo',
    LAYER: layer,
    INFOFORMAT: 'application/json',
    I: '128',
    J: '128',
    TILEMATRIXSET: 'EPSG:4326',
    TILEMATRIX: '5',
    TILEROW: '16',
    TILECOL: '32',
  });

  if (time) urlParams.set('TIME', time);
  if (elevation !== undefined) urlParams.set('ELEVATION', elevation.toString());

  try {
    const response = await fetch(`${WMTS_BASE_URL}?${urlParams.toString()}`);
    if (!response.ok) {
      throw new Error(`GetFeatureInfo failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      value: data.value ?? null,
      unit: variable.unit,
      time: time || new Date().toISOString(),
      coordinates: { lat, lon }
    };
  } catch (error) {
    console.error('GetFeatureInfo error:', error);
    return {
      value: null,
      unit: variable.unit,
      time: time || new Date().toISOString(),
      coordinates: { lat, lon }
    };
  }
}

/**
 * Obtém URL da legenda para uma variável
 */
export function getLegendUrl(
  variableId: VariableId,
  format: 'svg' | 'json' = 'svg'
): string {
  const variable = VARIABLES[variableId];
  const layer = `${PRODUCT_ID}/${variable.datasetId}`;
  const style = `cmap:${variable.colormap},range:${variable.range[0]}/${variable.range[1]}`;

  const urlParams = new URLSearchParams({
    SERVICE: 'WMTS',
    REQUEST: 'GetLegend',
    LAYER: layer,
    STYLE: style,
    FORMAT: format === 'svg' ? 'image/svg+xml' : 'application/json'
  });

  return `${WMTS_BASE_URL}?${urlParams.toString()}`;
}

/**
 * Verifica se o serviço WMTS está disponível
 */
export async function checkWMTSAvailability(): Promise<boolean> {
  try {
    const response = await fetch(
      `${WMTS_BASE_URL}?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch (error) {
    console.error('WMTS availability check failed:', error);
    return false;
  }
}
