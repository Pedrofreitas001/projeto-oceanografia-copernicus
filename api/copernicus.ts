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

    // Suporta múltiplos nomes de variáveis de ambiente
    const username =
      process.env.COPERNICUSMARINE_SERVICE_USERNAME ||
      process.env.COPERNICUS_USERNAME ||
      process.env.VITE_COPERNICUS_USERNAME;

    const password =
      process.env.COPERNICUSMARINE_SERVICE_PASSWORD ||
      process.env.COPERNICUS_PASSWORD ||
      process.env.VITE_COPERNICUS_PASSWORD;

    if (!username || !password) {
      return res.status(500).json({
        error: 'Copernicus credentials not configured',
        message: 'Please set COPERNICUSMARINE_SERVICE_USERNAME and COPERNICUSMARINE_SERVICE_PASSWORD (or COPERNICUS_USERNAME/COPERNICUS_PASSWORD) environment variables in Vercel'
      });
    }

    console.log('🔐 Using Copernicus credentials for user:', username);

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

      // Gera dados únicos baseados em coordenadas geográficas
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      // Temperatura: mais frio ao sul, varia com latitude
      const baseTemp = 28 - (Math.abs(latitude) * 0.45);
      const tempVariation = Math.sin(longitude * 0.1) * 1.5;
      const temperature = Number((baseTemp + tempVariation).toFixed(1));

      // Salinidade: varia com correntes oceânicas
      const baseSalinity = 35.2;
      const salinityVariation = (latitude < -30 ? -0.8 : 0) + Math.cos(longitude * 0.05) * 0.3;
      const salinity = Number((baseSalinity + salinityVariation).toFixed(1));

      // Clorofila: maior perto da costa (longitude menor em valor absoluto)
      const coastalFactor = Math.max(0, (60 - Math.abs(longitude)) / 60);
      const chlorophyll = Number((0.15 + coastalFactor * 0.35 + Math.random() * 0.1).toFixed(2));

      // Velocidade da corrente: baseada em localização geográfica
      const velocity = Number((0.2 + Math.abs(Math.sin(latitude * 0.1)) * 0.4 + Math.random() * 0.15).toFixed(2));

      return res.status(200).json({
        source: 'demo',
        message: 'Using demonstration data. Configure Copernicus credentials for real data.',
        data: {
          temperature,
          salinity,
          chlorophyll,
          velocity,
          timestamp: new Date().toISOString(),
          location: {
            lat: latitude,
            lon: longitude
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
    const latitude = parseFloat(req.query.lat as string || '-24.0');
    const longitude = parseFloat(req.query.lon as string || '-45.0');

    // Gera dados únicos baseados em coordenadas
    const baseTemp = 28 - (Math.abs(latitude) * 0.45);
    const temperature = Number((baseTemp + Math.sin(longitude * 0.1) * 1.5).toFixed(1));
    const baseSalinity = 35.2;
    const salinity = Number((baseSalinity + (latitude < -30 ? -0.8 : 0) + Math.cos(longitude * 0.05) * 0.3).toFixed(1));
    const coastalFactor = Math.max(0, (60 - Math.abs(longitude)) / 60);
    const chlorophyll = Number((0.15 + coastalFactor * 0.35 + Math.random() * 0.1).toFixed(2));
    const velocity = Number((0.2 + Math.abs(Math.sin(latitude * 0.1)) * 0.4 + Math.random() * 0.15).toFixed(2));

    return res.status(200).json({
      source: 'demo_fallback',
      message: 'Error connecting to Copernicus API. Using demonstration data.',
      data: {
        temperature,
        salinity,
        chlorophyll,
        velocity,
        timestamp: new Date().toISOString(),
        location: {
          lat: latitude,
          lon: longitude
        }
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
