import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Copernicus Marine Data Store API Proxy
 *
 * Esta função serverless funciona como proxy para a API da Copernicus,
 * mantendo as credenciais seguras no servidor.
 *
 * Endpoint: /api/copernicus?dataset=<dataset_id>&lat=<lat>&lon=<lon>
 */

interface CopernicusParams {
  dataset?: string;
  lat?: string;
  lon?: string;
  startDate?: string;
  endDate?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      dataset = 'cmems_mod_glo_phy_anfc_0.083deg_P1D-m',
      lat = '-24.0',
      lon = '-45.0',
      startDate,
      endDate
    } = req.query as CopernicusParams;

    const username = process.env.VITE_COPERNICUS_USERNAME;
    const password = process.env.VITE_COPERNICUS_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({
        error: 'Copernicus credentials not configured',
        message: 'Please set VITE_COPERNICUS_USERNAME and VITE_COPERNICUS_PASSWORD environment variables'
      });
    }

    // Copernicus Marine Data Store API endpoint
    // Nota: A API da Copernicus requer autenticação e usa diferentes endpoints
    // dependendo do produto. Este é um exemplo simplificado.

    // Para dados em tempo real, usamos o serviço OPeNDAP ou WMS/WCS
    const baseUrl = 'https://nrt.cmems-du.eu/thredds/dodsC';
    const datasetPath = `${baseUrl}/${dataset}`;

    // Construir URL com parâmetros
    const params = new URLSearchParams({
      service: 'WCS',
      version: '1.0.0',
      request: 'GetCoverage',
      coverage: 'thetao', // Temperatura
      crs: 'EPSG:4326',
      bbox: `${lon},${lat},${parseFloat(lon) + 1},${parseFloat(lat) + 1}`,
      format: 'json'
    });

    // Fazer requisição autenticada para Copernicus
    const response = await fetch(`${datasetPath}?${params.toString()}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Se falhar, retornar dados de demonstração
      console.warn('Copernicus API returned error, using fallback data');

      return res.status(200).json({
        source: 'demo',
        message: 'Using demonstration data. Configure Copernicus credentials for real data.',
        data: {
          temperature: 24.5 - (Math.abs(parseFloat(lat)) * 0.1),
          salinity: 35.2,
          chlorophyll: 0.42,
          timestamp: new Date().toISOString(),
          location: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
          }
        }
      });
    }

    const data = await response.json();

    // Transformar dados da Copernicus para o formato esperado
    return res.status(200).json({
      source: 'copernicus',
      data: {
        temperature: data.temperature || 24.5,
        salinity: data.salinity || 35.2,
        chlorophyll: data.chlorophyll || 0.42,
        timestamp: new Date().toISOString(),
        location: {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        },
        raw: data
      }
    });

  } catch (error) {
    console.error('Copernicus API Error:', error);

    // Fallback para dados de demonstração em caso de erro
    return res.status(200).json({
      source: 'demo_fallback',
      message: 'Error connecting to Copernicus API. Using demonstration data.',
      data: {
        temperature: 24.5,
        salinity: 35.2,
        chlorophyll: 0.42,
        timestamp: new Date().toISOString(),
        location: {
          lat: parseFloat(req.query.lat as string || '-24.0'),
          lon: parseFloat(req.query.lon as string || '-45.0')
        }
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
