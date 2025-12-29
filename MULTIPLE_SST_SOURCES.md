# Sistema de Múltiplas Fontes de Dados SST

## 🌊 Visão Geral

Sistema robusto com **4 fontes de dados SST** (Sea Surface Temperature) e fallback automático, permitindo visualização interativa de temperatura superficial dos oceanos em tempo real.

## 📊 Fontes de Dados Disponíveis

### 1. NOAA nowCOAST (Primária) ⭐
**Recomendado para**: Tempo Real Operacional

```
Status: ✅ Operacional
URL: https://nowcoast.noaa.gov/arcgis/services/nowcoast/
Resolução: 1/12° (~9km)
Atualização: Diária (04:00 UTC)
Cobertura: Global + Grandes Lagos
Produto: NCEP NSST Analysis
Formato: WMS 1.3.0 (time-enabled)
```

**Vantagens**:
- Dados operacionais NOAA/NCEP
- Atualização diária garantida
- Cobertura global confiável
- Produto oficial do NOAA

**Referências**:
- [NOAA nowCOAST](https://nowcoast.noaa.gov/)
- [WMS Service](https://nowcoast.noaa.gov/arcgis/services/nowcoast/analysis_ocean_sfc_sst_time/MapServer/WMSServer)

---

### 2. JPL MUR SST (Secundária)
**Recomendado para**: Ultra-Alta Resolução

```
Status: ✅ Operacional
URL: https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/
Resolução: 0.01° (~1km) - ULTRA-ALTA
Atualização: Diária
Cobertura: Global (2002-presente)
Produto: GHRSST Level 4 MUR
Formato: WMS + ERDDAP
```

**Vantagens**:
- Resolução mais alta disponível (1km!)
- Produto científico validado (GHRSST)
- Dados históricos desde 2002
- Multi-scale Ultra-high Resolution

**Referências**:
- [NOAA CoastWatch ERDDAP](https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/index.html)
- [JPL MUR SST Documentation](https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1)

---

### 3. NOAA Coral Reef Watch (Terciária)
**Recomendado para**: Dados Históricos + Corais

```
Status: ✅ Operacional
URL: https://coastwatch.noaa.gov/erddap/wms/noaacrwsstDaily/
Resolução: 5km (0.05°)
Atualização: Diária
Cobertura: Global (1985-presente)
Produto: CoralTemp v3.1
Formato: WMS + ERDDAP
```

**Vantagens**:
- Dados históricos longos (desde 1985)
- CoralTemp: produto específico para estudos de corais
- Consistência para estudos climáticos
- 3 fontes combinadas (OSTIA + Geo-Polar)

**Referências**:
- [NOAA Coral Reef Watch](https://coralreefwatch.noaa.gov/)
- [CoralTemp Product](https://coralreefwatch.noaa.gov/product/5km/index_5km_sst.php)
- [ERDDAP Access](https://coastwatch.noaa.gov/erddap/griddap/noaacrwsstDaily.html)

---

### 4. NASA GIBS MODIS (Backup)
**Recomendado para**: Fallback Global NASA

```
Status: ✅ Operacional
URL: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
Resolução: 4km
Atualização: Near Real-Time (poucas horas)
Cobertura: Global
Produto: MODIS Aqua L3 SST MidIR
Formato: WMTS
```

**Vantagens**:
- Infraestrutura robusta NASA EOSDIS
- >1000 produtos disponíveis
- Near real-time (poucas horas de latência)
- Tiles pré-renderizados (performance)

**Referências**:
- [NASA GIBS Documentation](https://nasa-gibs.github.io/gibs-api-docs/)
- [Worldview](https://worldview.earthdata.nasa.gov/)
- [GIBS API](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api)

---

## 🚀 Como Usar

### Componente MultiSourceSSTMap

```tsx
import { MultiSourceSSTMap } from './components/MultiSourceSSTMap';

<MultiSourceSSTMap
  selectedStation={selectedStation}
  stations={stations}
/>
```

### Funcionalidades:

#### 1. **Seleção Manual de Fonte**
- Clique no painel "Fonte de Dados SST"
- Escolha entre 4 fontes disponíveis
- Troca instantânea no mapa

#### 2. **Seletor de Data**
- Escolha qualquer data disponível
- Dados históricos dependendo da fonte
- Atualização automática do overlay

#### 3. **Fallback Automático**
- Sistema testa fontes em ordem de prioridade
- Se uma falha, tenta a próxima automaticamente
- Garantia de visualização sempre ativa

#### 4. **Monitoramento de Status**
- Contador de tiles carregados
- Detecção de erros
- Logs detalhados no console

---

## 🔧 API de Serviços

### Testar Disponibilidade

```typescript
import { testSSTDataSource, NOAA_NOWCOAST } from './services/sstDataSources';

const isAvailable = await testSSTDataSource(NOAA_NOWCOAST);
console.log('Fonte disponível:', isAvailable);
```

### Obter Melhor Fonte Automaticamente

```typescript
import { getAvailableSSTSource } from './services/sstDataSources';

const bestSource = await getAvailableSSTSource();
console.log('Usando fonte:', bestSource.name);
```

### Acessar Lista de Fontes

```typescript
import { SST_DATA_SOURCES } from './services/sstDataSources';

SST_DATA_SOURCES.forEach(source => {
  console.log(source.name, source.resolution);
});
```

---

## 📈 Comparação de Fontes

| Fonte | Resolução | Atualização | Histórico | Cobertura |
|-------|-----------|-------------|-----------|-----------|
| **NOAA nowCOAST** | 9km | Diária (04:00 UTC) | Limitado | Global + Lagos |
| **JPL MUR** | **1km** ⭐ | Diária | 2002-hoje | Global |
| **Coral Watch** | 5km | Diária | **1985-hoje** ⭐ | Global |
| **NASA GIBS** | 4km | **NRT** ⭐ | Recente | Global |

---

## 🎨 Personalização

### Modificar Ordem de Prioridade

Edite `services/sstDataSources.ts`:

```typescript
export const SST_DATA_SOURCES: SSTDataSource[] = [
  NOAA_JPL_MUR,        // 1ª: Ultra-alta resolução
  NOAA_NOWCOAST,       // 2ª: Tempo real
  NOAA_CORALWATCH,     // 3ª: Histórico
  NASA_GIBS_MODIS,     // 4ª: Backup
];
```

### Adicionar Nova Fonte

```typescript
export const MINHA_FONTE: SSTDataSource = {
  id: 'minha_fonte',
  name: 'Minha Fonte SST',
  type: 'wms',
  url: 'https://exemplo.com/wms',
  layers: 'sst_layer',
  format: 'image/png',
  attribution: '© Minha Organização',
  maxZoom: 12,
  minZoom: 2,
  opacity: 0.7,
  timeEnabled: true,
  resolution: '10km',
  updateFrequency: 'Horária',
  coverage: 'Regional',

  buildUrl: (date?: string) => {
    return `https://exemplo.com/wms?TIME=${date}...`;
  }
};
```

---

## 🔍 Debugging

### Console Logs

O sistema fornece logs detalhados:

```
🔍 Testing SST data sources...
✅ Using SST source: NOAA nowCOAST SST Analysis
🌊 Loading SST from: NOAA nowCOAST SST Analysis
📅 Date: 2025-12-28
✅ SST tile loaded (1): {x: 5, y: 12, z: 4}
✅ SST layer active: NOAA nowCOAST SST Analysis
📊 Resolution: 1/12° (~9km)
🔄 Update frequency: Diária (04:00 UTC)
```

### Troubleshooting

**Problema**: Tiles não carregam
- Verifique console para erros específicos
- Teste fonte manualmente: `testSSTDataSource(source)`
- Verifique data selecionada (pode não ter dados)

**Problema**: Fonte específica não funciona
- Sistema tentará próxima automaticamente
- Força outra fonte via seletor manual
- Verifique CORS/firewall

---

## 📚 Referências Completas

### NOAA Resources
- [NOAA CoastWatch](https://coastwatch.noaa.gov/)
- [nowCOAST](https://nowcoast.noaa.gov/)
- [Coral Reef Watch](https://coralreefwatch.noaa.gov/)
- [ERDDAP Documentation](https://coastwatch.pfeg.noaa.gov/erddap/wms/documentation.html)

### NASA Resources
- [NASA Earthdata](https://www.earthdata.nasa.gov/)
- [GIBS Documentation](https://nasa-gibs.github.io/gibs-api-docs/)
- [Worldview](https://worldview.earthdata.nasa.gov/)

### Scientific Papers
- [GHRSST MUR SST](https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1)
- [CoralTemp Validation](https://coralreefwatch.noaa.gov/product/5km/methodology.php)

---

## 📝 Licença e Atribuições

Todos os dados são fornecidos por agências governamentais e são de domínio público:

- **NOAA**: Public Domain (US Government)
- **NASA**: Open Data Policy
- **Esri**: Base map attribution required

Atribuições são incluídas automaticamente nos mapas.

---

## 🆘 Suporte

Para questões específicas sobre cada fonte de dados:

- **NOAA nowCOAST**: coastwatch.info@noaa.gov
- **NOAA CoralWatch**: coralreefwatch@noaa.gov
- **NASA GIBS**: support@earthdata.nasa.gov

---

Última atualização: Dezembro 2025
