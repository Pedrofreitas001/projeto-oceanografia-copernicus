// constants/datasets.ts
// Configurações dos datasets da Copernicus Marine Service

import { Variable, VariableId } from '../types/copernicus';

export const PRODUCT_ID = 'GLOBAL_ANALYSISFORECAST_PHY_001_024';
export const WMTS_BASE_URL = 'https://wmts.marine.copernicus.eu/teroWmts';

export const VARIABLES: Record<VariableId, Variable> = {
  thetao: {
    id: 'thetao',
    name: 'Temperatura da Água',
    unit: '°C',
    colormap: 'thermal',
    range: [-2, 35],
    datasetId: 'cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m'
  },
  so: {
    id: 'so',
    name: 'Salinidade',
    unit: 'PSU',
    colormap: 'haline',
    range: [30, 40],
    datasetId: 'cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m'
  },
  uo: {
    id: 'uo',
    name: 'Corrente Zonal',
    unit: 'm/s',
    colormap: 'balance',
    range: [-2, 2],
    datasetId: 'cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m'
  },
  vo: {
    id: 'vo',
    name: 'Corrente Meridional',
    unit: 'm/s',
    colormap: 'balance',
    range: [-2, 2],
    datasetId: 'cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m'
  },
  zos: {
    id: 'zos',
    name: 'Nível do Mar',
    unit: 'm',
    colormap: 'balance',
    range: [-1, 1],
    datasetId: 'cmems_mod_glo_phy_anfc_0.083deg_P1D-m'
  },
  mlotst: {
    id: 'mlotst',
    name: 'Camada de Mistura',
    unit: 'm',
    colormap: 'dense',
    range: [0, 500],
    datasetId: 'cmems_mod_glo_phy_anfc_0.083deg_P1D-m'
  }
};
