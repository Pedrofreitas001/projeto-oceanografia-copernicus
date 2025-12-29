# 🌍 NASA Web WorldWind - 3D Interactive Globe

## Visão Geral

O **NASAWorldWindMap** é um componente React que integra o **NASA Web WorldWind**, o motor 3D de globo planetário oficial da NASA desenvolvido em JavaScript/WebGL. Este componente oferece uma experiência imersiva de visualização 3D de dados oceanográficos.

**Diferencial principal**: Visualização em **globo 3D rotativo** ao invés de mapa 2D plano.

---

## 🚀 Características Principais

### 🌍 Globo 3D Interativo
- Renderização WebGL de alta performance
- Rotação e inclinação do globo em tempo real
- Zoom suave com níveis de detalhe automáticos
- Atmosfera e estrelas para realismo visual

### 🛰️ Integração NASA GIBS
Acesso direto aos dados oficiais da NASA via GIBS WMTS:
- **GHRSST MUR SST** (1km) - Multi-scale Ultra-high Resolution
- **MODIS Aqua SST MidIR Day** (4km) - Mid-infrared diurno
- **MODIS Aqua SST MidIR Night** (4km) - Mid-infrared noturno
- **NOAA WMS Fallback** - Sistema de fallback NOAA CoastWatch

### 📍 Marcadores de Estações
- Placemarks 3D para estações oceanográficas
- Diferentes cores por status (ativo, crítico)
- Destaque visual para estação selecionada
- Labels informativos

### 🎮 Controles Nativos
- **Compass Layer**: Bússola de navegação
- **Coordinates Display**: Exibição de coordenadas
- **View Controls**: Controles de visualização on-screen
- Controles de mouse/touch integrados

---

## 📋 Requisitos

### 1. Dependências NPM
Já incluídas no projeto:
```json
{
  "react": "^18.0.0",
  "typescript": "^5.0.0"
}
```

### 2. NASA WorldWind CDN
O componente carrega automaticamente o WorldWind via CDN:
```html
<!-- Carregado automaticamente -->
<script src="https://files.worldwind.arc.nasa.gov/artifactory/web/0.11.0/worldwind.min.js"></script>
```

**Nota**: O WorldWind é carregado dinamicamente. Não é necessário instalação via npm.

### 3. Imagens de Controle
Para exibir controles visuais completos, baixe as imagens do repositório oficial:

```bash
# Clone o repositório WorldWind
git clone https://github.com/NASAWorldWind/WebWorldWind.git

# Copie a pasta de imagens para seu projeto
cp -r WebWorldWind/images ./public/images
```

Alternativamente, o componente funciona sem as imagens (com controles básicos).

---

## 🔧 Como Usar

### Importação Básica

```tsx
import { NASAWorldWindMap } from './components/NASAWorldWindMap';

function App() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const stations = [...]; // Array de estações

  return (
    <div className="h-screen">
      <NASAWorldWindMap
        selectedStation={selectedStation}
        stations={stations}
      />
    </div>
  );
}
```

### Props Interface

```typescript
interface NASAWorldWindMapProps {
  selectedStation?: Station | null;  // Estação selecionada (opcional)
  stations?: Station[];              // Array de estações (opcional)
}

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'critical' | 'inactive';
  region: string;
}
```

---

## 🎮 Controles do Usuário

### Controles de Mouse

| Ação | Efeito |
|------|--------|
| **Arrastar (Drag)** | Rotaciona o globo |
| **Scroll (Roda)** | Zoom in/out |
| **Shift + Arrastar** | Inclina a visualização (tilt) |
| **Ctrl + Arrastar** | Rotaciona a câmera |
| **Duplo clique** | Zoom rápido para o local |

### Controles de Touch (Mobile)

| Gesto | Efeito |
|-------|--------|
| **Deslizar (Swipe)** | Rotaciona o globo |
| **Pinch** | Zoom in/out |
| **Dois dedos girar** | Rotaciona a câmera |
| **Dois dedos arrastar vertical** | Inclina visualização |

### Controles de Teclado

| Tecla | Efeito |
|-------|--------|
| **Arrow Keys** | Pan (mover vista) |
| **+ / -** | Zoom in/out |
| **R** | Reset para vista inicial |

---

## 🛰️ Camadas SST Disponíveis

### 1. GHRSST MUR SST (GIBS) ⭐ Recomendado

**Descrição**: Multi-scale Ultra-high Resolution Sea Surface Temperature
```
Fonte: NASA GIBS WMTS
Layer ID: GHRSST_L4_MUR_Sea_Surface_Temperature
Resolução: 1km (0.01°)
Cobertura: Global
Temporal: Diária desde 2002-06-01
Algoritmo: Multi-sensor optimal interpolation
```

**Quando usar**:
- ✅ Máxima resolução espacial (1km)
- ✅ Melhor cobertura temporal
- ✅ Produto científico de alta qualidade
- ✅ Ideal para estudos de mesoescala

**Exemplo de URL WMTS**:
```
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
  GHRSST_L4_MUR_Sea_Surface_Temperature/default/
  2025-12-28/GoogleMapsCompatible_Level9/
  {z}/{y}/{x}.png
```

---

### 2. MODIS Aqua SST MidIR (Day)

**Descrição**: Mid-infrared daytime SST from MODIS Aqua
```
Fonte: NASA GIBS WMTS
Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily
Resolução: 4km
Cobertura: Global
Temporal: Diária desde 2002-07-04
Algoritmo: Mid-infrared (3.95-4.05 μm)
Passagem: ~13:30 local time
```

**Vantagens**:
- Menos afetado por aerossóis atmosféricos
- Melhor em áreas com poeira/fumaça
- Validação cruzada com thermal IR

**Limitações**:
- Nuvens bloqueiam medição
- Apenas uma passagem diurna

---

### 3. MODIS Aqua SST MidIR (Night)

**Descrição**: Mid-infrared nighttime SST from MODIS Aqua
```
Fonte: NASA GIBS WMTS
Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily
Resolução: 4km
Cobertura: Global
Temporal: Diária desde 2002-07-04
Passagem: ~01:30 local time
```

**Casos de uso**:
- Estudo do ciclo diurno de SST
- Complementar dados diurnos
- Áreas com nebulosidade diurna recorrente

---

### 4. NOAA JPL MUR WMS (Fallback)

**Descrição**: Fallback via WMS da NOAA CoastWatch
```
Fonte: NOAA ERDDAP WMS
Dataset: jplMURSST41
Resolução: 1km
Serviço: WMS 1.3.0
```

**Quando usar**:
- GIBS WMTS indisponível
- Necessidade de parâmetros WMS customizados
- Integração com outros serviços ERDDAP

---

## 🎨 Personalização

### Alterar Camada Padrão

```typescript
// Em NASAWorldWindMap.tsx, linha ~14 (aprox)

// Mudar para GHRSST MUR:
const [selectedLayer, setSelectedLayer] = useState<SSTLayerConfig>(SST_LAYERS[0]);

// Ou para MODIS Night:
const [selectedLayer, setSelectedLayer] = useState<SSTLayerConfig>(SST_LAYERS[2]);
```

### Ajustar Vista Inicial

```typescript
// No useEffect de inicialização, após criar wwd:

// Vista do Brasil (padrão):
wwd.navigator.lookAtLocation.latitude = -23.5;
wwd.navigator.lookAtLocation.longitude = -45.0;
wwd.navigator.range = 2000000; // 2000km altitude

// Vista global:
wwd.navigator.lookAtLocation.latitude = 0;
wwd.navigator.lookAtLocation.longitude = 0;
wwd.navigator.range = 20000000; // 20000km altitude

// Vista do Pacífico:
wwd.navigator.lookAtLocation.latitude = 0;
wwd.navigator.lookAtLocation.longitude = -150;
wwd.navigator.range = 10000000;
```

### Modificar Opacidade da Camada SST

```typescript
// Após criar a camada (wmtsLayer ou wmsLayer):

wmtsLayer.opacity = 0.5;  // 50% transparente
// ou
wmtsLayer.opacity = 1.0;  // 100% opaco
```

### Adicionar Camadas Customizadas

```typescript
const CUSTOM_LAYER: SSTLayerConfig = {
  id: 'minha_camada',
  name: 'Minha Camada SST',
  description: 'Descrição customizada',
  serviceType: 'GIBS_WMTS',
  identifier: 'LAYER_IDENTIFIER_FROM_GIBS',
  temporal: true,
  resolution: '1km',
  timeRange: '2020-01-01 to present'
};

// Adicione ao array SST_LAYERS
const SST_LAYERS: SSTLayerConfig[] = [
  // ... camadas existentes
  CUSTOM_LAYER
];
```

---

## 🆚 Comparação: WorldWind vs Leaflet

| Recurso | WorldWind 3D | Leaflet 2D (NASAWorldviewStyleMap) |
|---------|-------------|-----------------------------------|
| **Visualização** | Globo 3D | Mapa plano 2D |
| **Renderização** | WebGL | Canvas 2D |
| **Performance** | GPU-accelerated | CPU-based |
| **Imersão** | ⭐⭐⭐⭐⭐ Alta | ⭐⭐⭐ Média |
| **Timeline Animada** | ❌ Não | ✅ Sim |
| **Playback Controls** | ❌ Não | ✅ Sim (1x-8x) |
| **Fallback Automático** | ❌ Não | ❌ Não |
| **Mobile** | ⚠️ Limitado | ✅ Excelente |
| **Curva de Aprendizado** | Moderada | Baixa |
| **Integração React** | Custom | Nativa (react-leaflet disponível) |
| **Tamanho do Bundle** | ~500KB (CDN) | ~200KB |

### Quando usar WorldWind 3D:
- ✅ Apresentações e demos impressionantes
- ✅ Visualização de dados globais
- ✅ Aplicações científicas/educacionais
- ✅ Quando GPU está disponível
- ✅ Desktop/laptops principalmente

### Quando usar Leaflet 2D:
- ✅ Análise temporal detalhada
- ✅ Animações de eventos
- ✅ Mobile-first applications
- ✅ Quando precisa de timeline
- ✅ Performance crítica em baixo-end devices

---

## 🔧 Troubleshooting

### Problema: Globo não carrega (tela preta)

**Causas possíveis**:
1. WorldWind CDN não carregou
2. Canvas não foi criado corretamente
3. WebGL não suportado pelo navegador

**Soluções**:
```javascript
// 1. Verificar suporte a WebGL
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.error('WebGL não suportado!');
}

// 2. Verificar carregamento do WorldWind
console.log('WorldWind loaded:', !!window.WorldWind);

// 3. Verificar erros no console do navegador
```

### Problema: Controles não aparecem

**Causa**: Imagens de controle não encontradas

**Solução**:
```bash
# Opção 1: Baixar imagens do GitHub
wget -r -np -nH --cut-dirs=3 -R "index.html*" https://raw.githubusercontent.com/NASAWorldWind/WebWorldWind/develop/images/

# Opção 2: Usar CDN
WorldWind.configuration.baseUrl = "https://files.worldwind.arc.nasa.gov/artifactory/web/0.11.0/";
```

### Problema: SST Layer não aparece

**Verificação**:
1. Data selecionada está dentro do range do produto
2. Layer identifier está correto
3. Tiles estão sendo requisitados (ver Network tab)

**Debug**:
```typescript
// Adicione logging na função urlBuilder
urlBuilder: {
  urlForTile: function(tile: any, imageFormat: string) {
    const url = `...`; // sua URL
    console.log('Requesting tile:', url);
    return url;
  }
}
```

### Problema: Performance ruim (laggy)

**Otimizações**:
```typescript
// 1. Reduzir níveis de detalhe
const wmtsLayer = new WorldWind.WmtsLayer({
  // ...
  numLevels: 8, // Ao invés de 10
});

// 2. Ajustar qualidade de renderização
wwd.drawContext.gpuCacheSize = 200000000; // 200MB ao invés de padrão

// 3. Desabilitar atmosfera/estrelas em low-end devices
// Comentar estas linhas:
// wwd.addLayer(new WorldWind.AtmosphereLayer());
// wwd.addLayer(new WorldWind.StarFieldLayer());
```

---

## 📚 Documentação Oficial

### NASA Web WorldWind
- **Homepage**: https://worldwind.arc.nasa.gov/web/
- **GitHub**: https://github.com/NASAWorldWind/WebWorldWind
- **API Documentation**: https://worldwind.arc.nasa.gov/web/docs/
- **Get Started Guide**: https://worldwind.arc.nasa.gov/web/get-started/
- **Examples**: https://worldwind.arc.nasa.gov/web/examples/

### NASA GIBS
- **API Docs**: https://nasa-gibs.github.io/gibs-api-docs/
- **Access Basics**: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
- **Available Visualizations**: https://worldview.earthdata.nasa.gov/

### MODIS SST
- **Product Page**: https://modis.gsfc.nasa.gov/data/dataprod/mod28.php
- **PO.DAAC**: https://podaac.jpl.nasa.gov/
- **Algorithm**: https://oceancolor.gsfc.nasa.gov/atbd/sst/

### GHRSST
- **Project Homepage**: https://www.ghrsst.org/
- **MUR Dataset**: https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1
- **User Guide**: https://podaac.jpl.nasa.gov/forum/viewtopic.php?f=7&t=219

---

## 🎯 Casos de Uso Avançados

### 1. Visualização Global de Anomalias de SST

```typescript
// Iniciar com vista global
wwd.navigator.range = 20000000; // Altitude global

// Usar GHRSST MUR para máxima cobertura
setSelectedLayer(SST_LAYERS.find(l => l.id === 'ghrsst_mur_gibs'));

// Comparar com climatologia (implementação futura)
```

### 2. Tracking de Frentes Oceânicas

```typescript
// Usar MODIS Day para detectar gradientes térmicos
setSelectedLayer(SST_LAYERS.find(l => l.id === 'modis_sst_day'));

// Zoom para região de interesse
wwd.goTo(new WorldWind.Position(-35, -50, 500000));

// Alternar datas para observar movimento
setCurrentDate('2025-12-15');
// ... depois
setCurrentDate('2025-12-20');
```

### 3. Estudo de Ressurgência Costeira

```typescript
// Vista da costa brasileira
wwd.navigator.lookAtLocation.latitude = -23;
wwd.navigator.lookAtLocation.longitude = -42;
wwd.navigator.range = 300000; // 300km altitude

// MODIS Night (menos nuvens costeiras)
setSelectedLayer(SST_LAYERS.find(l => l.id === 'modis_sst_night'));
```

---

## 🔐 Licença e Atribuições

### NASA WorldWind
```
Apache License 2.0
Copyright (c) 2024 NASA
```

### NASA GIBS Data
```
Public Domain - US Government Work
No copyright restrictions
Attribution appreciated but not required
```

### Atribuição Recomendada
```
"Powered by NASA Web WorldWind"
"Sea Surface Temperature data from NASA EOSDIS GIBS"
"MODIS data courtesy of NASA/GSFC/OBPG"
"GHRSST MUR SST data from NASA JPL/PO.DAAC"
```

---

## ✅ Checklist de Integração

Antes de usar em produção:

- [ ] WorldWind CDN carrega corretamente
- [ ] Canvas renderiza globo 3D
- [ ] Controles de mouse funcionam (drag, zoom)
- [ ] Camadas SST estão visíveis
- [ ] Seleção de data funciona
- [ ] Marcadores de estações aparecem
- [ ] Navegação para estação selecionada funciona
- [ ] Performance aceitável em dispositivo-alvo
- [ ] WebGL suportado pelos navegadores-alvo
- [ ] Fallback para navegadores sem WebGL (se necessário)
- [ ] Testes em mobile/tablet
- [ ] Atribuições incluídas

---

## 🆘 Suporte

### Questões sobre WorldWind
- **GitHub Issues**: https://github.com/NASAWorldWind/WebWorldWind/issues
- **Forum**: https://forum.worldwindcentral.com/

### Questões sobre GIBS
- **Email**: support@earthdata.nasa.gov
- **Forum**: https://forum.earthdata.nasa.gov/

### Questões sobre MODIS/GHRSST
- **PO.DAAC**: podaac@jpl.nasa.gov
- **OB.DAAC**: obdaac@oceancolor.gsfc.nasa.gov

---

**Última atualização**: Dezembro 2025
**Versão**: 1.0.0
**Compatibilidade**: Web WorldWind 0.11.0 | React 18+
