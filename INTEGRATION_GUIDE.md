# 🔧 Guia de Integração - NASA Worldview Style Map

## Opções de Mapas SST Disponíveis

Você agora tem **3 componentes de mapa SST** diferentes para escolher:

| Componente | Melhor Para | Características Principais |
|------------|-------------|---------------------------|
| **OceanMap** | Dashboard padrão | SST overlay simples, marcadores de estações |
| **MultiSourceSSTMap** | Confiabilidade | 4 fontes com fallback automático |
| **NASAWorldviewStyleMap** | Análise temporal | Timeline animada, estilo NASA Worldview ⭐ |

---

## ⭐ Integrando o NASA Worldview Style Map

### Opção 1: Substituir o OceanMap no Dashboard

**Arquivo**: `pages/Dashboard.tsx`

```typescript
// ANTES
import { OceanMap, TemperatureChart, SalinityChart } from '../components/Visualizations';

// DEPOIS
import { TemperatureChart, SalinityChart } from '../components/Visualizations';
import { NASAWorldviewStyleMap } from '../components/NASAWorldviewStyleMap';
```

**No JSX do Dashboard** (procure por `<OceanMap .../>` e substitua):

```tsx
{/* ANTES */}
<OceanMap
  selectedStation={selectedStation}
  stations={stations}
  metrics={metrics}
/>

{/* DEPOIS */}
<NASAWorldviewStyleMap
  selectedStation={selectedStation}
  stations={stations}
/>
```

---

### Opção 2: Adicionar como Aba Adicional

**Criar um sistema de abas** no Dashboard para alternar entre visualizações:

```typescript
// No Dashboard.tsx, adicione state:
const [mapView, setMapView] = useState<'standard' | 'worldview' | 'multisource'>('standard');

// No JSX, adicione botões de seleção:
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setMapView('standard')}
    className={mapView === 'standard' ? 'active' : ''}
  >
    🗺️ Mapa Padrão
  </button>
  <button
    onClick={() => setMapView('worldview')}
    className={mapView === 'worldview' ? 'active' : ''}
  >
    🛰️ NASA Worldview
  </button>
  <button
    onClick={() => setMapView('multisource')}
    className={mapView === 'multisource' ? 'active' : ''}
  >
    🌊 Multi-Source
  </button>
</div>

{/* Renderização condicional */}
{mapView === 'standard' && (
  <OceanMap selectedStation={selectedStation} stations={stations} metrics={metrics} />
)}

{mapView === 'worldview' && (
  <NASAWorldviewStyleMap selectedStation={selectedStation} stations={stations} />
)}

{mapView === 'multisource' && (
  <MultiSourceSSTMap selectedStation={selectedStation} stations={stations} />
)}
```

---

### Opção 3: Página Dedicada

**Criar nova rota** para análise temporal detalhada:

**Arquivo**: `pages/TemporalAnalysis.tsx` (criar novo)

```typescript
import React from 'react';
import { NASAWorldviewStyleMap } from '../components/NASAWorldviewStyleMap';
import { Station } from '../types';

interface TemporalAnalysisProps {
  selectedStation?: Station | null;
  stations?: Station[];
}

export const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({
  selectedStation,
  stations = []
}) => {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          🛰️ Análise Temporal SST - NASA Worldview Style
        </h1>
        <p className="text-slate-400 mb-6">
          Visualização interativa de temperatura superficial dos oceanos com timeline animada
        </p>

        <div className="w-full h-[calc(100vh-200px)]">
          <NASAWorldviewStyleMap
            selectedStation={selectedStation}
            stations={stations}
          />
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">🛰️ Fontes de Dados</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• MODIS Aqua Day/Night</li>
              <li>• MODIS Thermal IR</li>
              <li>• JPL MUR SST (1km)</li>
            </ul>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">🎬 Funcionalidades</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Timeline interativa</li>
              <li>• Playback animado (1x-8x)</li>
              <li>• Seleção de intervalo temporal</li>
            </ul>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">📊 Resolução</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• MODIS: 4km</li>
              <li>• JPL MUR: 1km</li>
              <li>• Atualização: Diária</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Adicionar ao roteador** (em `App.tsx` ou similar):

```typescript
import { TemporalAnalysis } from './pages/TemporalAnalysis';

// Na configuração de rotas:
<Route path="/temporal-analysis" element={<TemporalAnalysis stations={stations} />} />
```

---

## 🎨 Personalização do Componente

### Ajustar Altura do Mapa

Por padrão, o componente tem `min-h-[500px]`. Para tela cheia:

```tsx
<div className="w-full h-screen">
  <NASAWorldviewStyleMap
    selectedStation={selectedStation}
    stations={stations}
  />
</div>
```

### Modificar Camadas Padrão

**Arquivo**: `components/NASAWorldviewStyleMap.tsx`, linha ~73

```typescript
// Mudar camada inicial de MODIS Day para JPL MUR:
const [selectedLayer, setSelectedLayer] = useState<SSTLayer>(SST_LAYERS[3]); // JPL MUR

// Ou criar estado baseado em preferência do usuário:
const [selectedLayer, setSelectedLayer] = useState<SSTLayer>(
  SST_LAYERS.find(l => l.id === 'modis_sst_night') || SST_LAYERS[0]
);
```

### Alterar Intervalo Temporal Padrão

**Arquivo**: `components/NASAWorldviewStyleMap.tsx`, linha ~80

```typescript
// Mudar de 7 dias para 30 dias:
const [dateRange, setDateRange] = useState({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
});
```

### Ocultar Timeline por Padrão

**Arquivo**: `components/NASAWorldviewStyleMap.tsx`, linha ~85

```typescript
// Começar com timeline oculta:
const [showTimelinePanel, setShowTimelinePanel] = useState(false); // era true
```

---

## 🔄 Comparação de Casos de Uso

### Quando usar OceanMap (padrão):
- ✅ Dashboard geral do sistema
- ✅ Visão rápida de estações
- ✅ Overlay SST simples
- ✅ Foco em dados in-situ

### Quando usar MultiSourceSSTMap:
- ✅ Produção crítica
- ✅ Precisa de fallback automático
- ✅ Comparação entre fontes de dados
- ✅ Confiabilidade > funcionalidades

### Quando usar NASAWorldviewStyleMap:
- ✅ Análise temporal detalhada
- ✅ Estudos de eventos (ondas de calor, frentes frias)
- ✅ Criação de animações
- ✅ Pesquisa científica
- ✅ Apresentações e reports

---

## 🚀 Exemplo Completo de Integração

**Cenário**: Adicionar visualização temporal como feature separada

### 1. Criar novo item no menu de navegação

```typescript
// Em seu componente de navegação:
<nav>
  <a href="/">Dashboard</a>
  <a href="/stations">Estações</a>
  <a href="/temporal">Análise Temporal</a> {/* NOVO */}
</nav>
```

### 2. Criar página dedicada

```typescript
// pages/TemporalAnalysis.tsx
import { NASAWorldviewStyleMap } from '../components/NASAWorldviewStyleMap';

export const TemporalAnalysis = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    // Carregar estações da API
    loadStations().then(setStations);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-slate-900 p-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">
          🛰️ Análise Temporal SST
        </h1>
      </header>

      <div className="flex-1">
        <NASAWorldviewStyleMap
          selectedStation={selectedStation}
          stations={stations}
        />
      </div>
    </div>
  );
};
```

### 3. Adicionar ao router

```typescript
// App.tsx
import { TemporalAnalysis } from './pages/TemporalAnalysis';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/temporal" element={<TemporalAnalysis />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📊 Performance Considerations

### Otimização de Tiles

O componente carrega tiles conforme necessário. Para melhor performance:

1. **Limite o intervalo temporal inicial** (7 dias é bom)
2. **Use velocidades moderadas** (2x-4x) para animação
3. **Evite zoom excessivo** em JPL MUR (1km) que carrega muitos tiles

### Cache do Navegador

Tiles NASA GIBS são cacheados automaticamente pelo navegador. Para limpar cache:

```javascript
// No console do navegador:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module NASAWorldviewStyleMap"

**Solução**: Verifique o caminho de import:
```typescript
// Correto:
import { NASAWorldviewStyleMap } from '../components/NASAWorldviewStyleMap';

// Se estiver em pages/:
import { NASAWorldviewStyleMap } from '../components/NASAWorldviewStyleMap';

// Se estiver em components/:
import { NASAWorldviewStyleMap } from './NASAWorldviewStyleMap';
```

### Problema: Tiles não carregam

**Verifique**:
1. Console do navegador para erros CORS
2. Data selecionada não está muito antiga
3. Conexão com internet está ativa
4. Tente camada alternativa (MODIS → JPL MUR)

### Problema: Timeline não aparece

**Solução**: Certifique-se que `showTimelinePanel` está `true`:
```typescript
const [showTimelinePanel, setShowTimelinePanel] = useState(true);
```

Ou clique no botão "🎬 Show Timeline" no canto inferior esquerdo.

---

## 📚 Documentação Adicional

Para mais detalhes sobre funcionalidades específicas, consulte:

- **[NASA_WORLDVIEW_STYLE.md](./NASA_WORLDVIEW_STYLE.md)**: Documentação completa do componente
- **[MULTIPLE_SST_SOURCES.md](./MULTIPLE_SST_SOURCES.md)**: Sistema multi-source

---

## ✅ Checklist de Integração

Antes de fazer deploy:

- [ ] Componente importado corretamente
- [ ] Stations array sendo passado como prop
- [ ] Altura do container configurada adequadamente
- [ ] Testado em diferentes resoluções de tela
- [ ] Timeline funcionando (play/pause/slider)
- [ ] Múltiplas camadas testadas
- [ ] Verificado performance com intervalos longos (30 dias)
- [ ] Console sem erros
- [ ] Tiles carregando corretamente

---

**Última atualização**: Dezembro 2025
