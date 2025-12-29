# 🛰️ NASA Worldview Style SST Map

## Visão Geral

Componente de mapa interativo de SST (Sea Surface Temperature) inspirado no **NASA Earthdata Worldview**, oferecendo:

- 🎬 **Timeline interativa** com controles de animação
- 🛰️ **4 camadas SST diferentes** (MODIS Day/Night, Thermal, JPL MUR)
- ▶️ **Playback animado** com controle de velocidade
- 📅 **Seleção de intervalo temporal** personalizado
- 🎨 **Interface profissional** estilo NASA

---

## 🚀 Como Usar

### Importação Básica

```tsx
import { NASAWorldviewStyleMap } from './components/NASAWorldviewStyleMap';

<NASAWorldviewStyleMap
  selectedStation={selectedStation}
  stations={stations}
/>
```

---

## 🛰️ Camadas Disponíveis

### 1. MODIS Aqua SST (Day) ☀️
**Recomendado para**: Dados diurnos de alta qualidade

```
Satélite: MODIS Aqua
Período: Dia (10:30 AM local)
Resolução: 4km
Atualização: Diária
Tipo: MidIR (Mid-Infrared)
Fonte: NASA GIBS
```

**Características**:
- Dados coletados durante passagem diurna do satélite
- Melhor cobertura em áreas sem nuvens
- MidIR: menos afetado por aerossóis atmosféricos

---

### 2. MODIS Aqua SST (Night) 🌙
**Recomendado para**: Dados noturnos complementares

```
Satélite: MODIS Aqua
Período: Noite (1:30 AM local)
Resolução: 4km
Atualização: Diária
Tipo: MidIR (Mid-Infrared)
Fonte: NASA GIBS
```

**Características**:
- Dados coletados durante passagem noturna
- Complementar aos dados diurnos
- Útil para estudos de ciclo diurno de SST

---

### 3. MODIS Aqua SST Thermal (Day) 🌡️
**Recomendado para**: Comparação com dados térmicos

```
Satélite: MODIS Aqua
Período: Dia
Resolução: 4km
Atualização: Diária
Tipo: Thermal IR
Fonte: NASA GIBS
```

**Características**:
- Infravermelho térmico (bandas 31-32)
- Diferentes características de penetração atmosférica
- Útil para validação cruzada

---

### 4. JPL MUR SST (1km) 🔬
**Recomendado para**: Ultra-alta resolução

```
Produto: GHRSST Level 4 MUR
Resolução: 1km (0.01°)
Atualização: Diária
Cobertura: Global
Histórico: 2002-presente
Fonte: NOAA CoastWatch ERDDAP
```

**Características**:
- **Resolução mais alta disponível (1km!)**
- Multi-scale Ultra-high Resolution
- Combina múltiplos satélites (MODIS, AMSR, AVHRR, in-situ)
- Produto científico validado GHRSST

---

## 🎬 Controles da Timeline

### Botões de Navegação

| Botão | Ação | Atalho |
|-------|------|--------|
| ⏮️ **First** | Vai para primeira data | - |
| ⏪ **Previous** | Data anterior (-1 dia) | - |
| ▶️ **Play** | Inicia animação | - |
| ⏸️ **Pause** | Pausa animação | - |
| ⏩ **Next** | Próxima data (+1 dia) | - |
| ⏭️ **Last** | Vai para última data | - |

### Controle de Velocidade

```
1x  = 1000ms por frame (1 segundo)
2x  = 500ms por frame (meio segundo)
4x  = 250ms por frame
8x  = 125ms por frame
```

**Como ajustar**:
Selecione a velocidade no dropdown "Speed" no canto direito da timeline.

### Slider de Tempo

- **Clique e arraste** o slider para navegar rapidamente
- **Barra de progresso azul** mostra posição atual
- **Marcadores de data** nos extremos (início/fim)

---

## 📅 Seleção de Intervalo Temporal

### Date Range Picker

Configure o período de interesse:

```tsx
From: [2025-12-01]  ← Data inicial
To:   [2025-12-28]  ← Data final
```

### Atalhos Rápidos

**Last 7 Days**: Últimos 7 dias
```
Configura automaticamente:
- Início: hoje - 7 dias
- Fim: ontem
```

**Last 30 Days**: Últimos 30 dias
```
Configura automaticamente:
- Início: hoje - 30 dias
- Fim: ontem
```

---

## 🎨 Interface e Funcionalidades

### Painel de Camadas (Layer Selection)

**Localização**: Canto superior esquerdo

**Como usar**:
1. Clique no botão "🛰️ SST Layer"
2. Escolha uma das 4 camadas disponíveis
3. Camada ativa destacada em azul
4. Informações de resolução e frequência exibidas

**Informações exibidas**:
- Nome da camada
- Resolução espacial
- Frequência de atualização
- Descrição detalhada

### Painel de Informações (Info Panel)

**Localização**: Canto superior direito

**Mostra**:
- 📅 Data atual selecionada
- 🛰️ Resolução da camada ativa
- Tiles: Contador de tiles carregados (✓) e erros (✗)

### Timeline Panel

**Localização**: Parte inferior da tela

**Componentes**:
1. **Display de Data**: Data atual em formato legível
2. **Frame Counter**: "Frame X of Y"
3. **Playback Controls**: Botões de navegação
4. **Speed Control**: Seletor de velocidade
5. **Timeline Slider**: Barra de progresso interativa
6. **Date Range Picker**: Configuração de intervalo
7. **Quick Actions**: Atalhos 7/30 dias

**Pode ser ocultado**: Clique em "🎬 Hide Timeline" (canto inferior esquerdo)

---

## 🔧 Funcionalidades Avançadas

### 1. Animação Temporal

**Como criar animações**:

```typescript
1. Selecione intervalo de datas (ex: 7 dias)
2. Escolha velocidade (ex: 4x)
3. Clique em ▶️ Play
4. Observe evolução temporal do SST
5. Pause quando necessário
```

**Use cases**:
- Visualizar passagem de frentes frias
- Observar aquecimento/resfriamento sazonal
- Identificar eventos extremos (ondas de calor marinhas)
- Estudar circulação oceânica

### 2. Comparação de Camadas

**Workflow recomendado**:

```
1. Observe MODIS Day para cobertura diurna
2. Compare com MODIS Night para ciclo diurno
3. Valide com MODIS Thermal para consistência
4. Use JPL MUR para detalhes em alta resolução
```

### 3. Navegação Manual

**Frame-by-frame**:
- Use ⏪/⏩ para avançar 1 dia por vez
- Ideal para identificar mudanças sutis
- Permite análise detalhada dia a dia

**Jump to specific date**:
- Arraste o slider para data aproximada
- Use date pickers para data exata

---

## 📊 Dados Técnicos

### NASA GIBS (Global Imagery Browse Services)

```
URL Base: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best
Formato: WMTS (Web Map Tile Service)
Projeção: EPSG:3857 (Web Mercator)
Formato de Imagem: PNG
Transparência: Suportada
Zoom: Níveis 2-12
```

**Estrutura de URL**:
```
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
  {LAYER_NAME}/default/{DATE}/
  GoogleMapsCompatible_Level7/{z}/{y}/{x}.png
```

**Exemplo**:
```
Layer: MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily
Date: 2025-12-28
Tile: z=4, x=5, y=12
```

### NOAA ERDDAP WMS

```
URL: https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request
Serviço: WMS 1.3.0
Dataset: jplMURSST41
Variável: analysed_sst
Range de Cor: 0-32°C
CRS: EPSG:3857
```

**Parâmetros TIME**:
```
Formato: YYYY-MM-DDTHH:MM:SS.sssZ
Exemplo: 2025-12-28T00:00:00.000Z
```

---

## 🎯 Casos de Uso

### 1. Monitoramento de Eventos Extremos

**Ondas de Calor Marinhas**:
```
1. Selecione período suspeito (ex: verão 2024)
2. Use JPL MUR (1km) para máxima resolução
3. Crie animação em velocidade 2x-4x
4. Identifique anomalias de temperatura
```

### 2. Estudos Sazonais

**Transição Inverno-Verão**:
```
1. Date Range: 01/06 a 31/12 (6 meses)
2. Layer: MODIS Night (menos nuvens)
3. Speed: 4x-8x (visualização rápida)
4. Observe padrões de aquecimento/resfriamento
```

### 3. Validação de Dados In-Situ

**Comparar estações com satélite**:
```
1. Selecione data de medição in-situ
2. Use múltiplas camadas para validação cruzada
3. Compare MODIS Day vs Night vs JPL MUR
4. Identifique discrepâncias
```

### 4. Análise de Correntes Oceânicas

**Visualizar estruturas de mesoescala**:
```
1. Região costeira ou frontal
2. JPL MUR 1km (máxima resolução)
3. Animação lenta (1x-2x)
4. Observe vórtices, frentes, filamentos
```

---

## 🔍 Troubleshooting

### Problema: Tiles não carregam

**Possíveis causas**:
1. Data muito antiga (NASA GIBS tem limitações temporais)
2. Conexão de internet instável
3. Serviço temporariamente indisponível

**Soluções**:
```
1. Verifique contador de erros no Info Panel
2. Tente camada alternativa (ex: MODIS → JPL MUR)
3. Selecione data mais recente
4. Verifique console para erros específicos
```

### Problema: Animação travando

**Causas**:
- Velocidade muito rápida (8x) + intervalo longo
- Navegador com pouco memória
- Muitos tiles sendo carregados simultaneamente

**Soluções**:
```
1. Reduza velocidade para 2x ou 4x
2. Diminua intervalo temporal (7 dias ao invés de 30)
3. Feche outras abas do navegador
4. Use camada menos detalhada (MODIS ao invés de JPL MUR)
```

### Problema: Camada muito transparente

**Ajuste de opacidade**:
Atualmente fixo em `0.7`. Para ajustar:

```typescript
// Em NASAWorldviewStyleMap.tsx, linha ~167
opacity: 0.7  // Altere para 0.5-1.0
```

---

## 📚 Referências Técnicas

### NASA GIBS

- **Documentação oficial**: https://nasa-gibs.github.io/gibs-api-docs/
- **Worldview**: https://worldview.earthdata.nasa.gov/
- **Available Imagery Products**: https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
- **API Basics**: https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api

### MODIS SST

- **Product Info**: https://modis.gsfc.nasa.gov/data/dataprod/mod28.php
- **Algorithm Theoretical Basis**: https://oceancolor.gsfc.nasa.gov/docs/technical/
- **Quality Flags**: https://oceancolor.gsfc.nasa.gov/atbd/sst/

### JPL MUR SST

- **PO.DAAC Dataset**: https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1
- **User Guide**: https://podaac.jpl.nasa.gov/forum/viewtopic.php?f=7&t=219
- **GHRSST Project**: https://www.ghrsst.org/

### NOAA ERDDAP

- **CoastWatch ERDDAP**: https://coastwatch.pfeg.noaa.gov/erddap/index.html
- **WMS Documentation**: https://coastwatch.pfeg.noaa.gov/erddap/wms/documentation.html
- **jplMURSST41 Dataset**: https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.html

---

## 🎨 Customização

### Adicionar Nova Camada

```typescript
// Em NASAWorldviewStyleMap.tsx

const NOVA_CAMADA: SSTLayer = {
  id: 'minha_camada',
  name: 'Minha Camada SST',
  description: 'Descrição da camada',
  type: 'wmts',
  url: 'https://...',
  format: 'image/png',
  resolution: '1km',
  updateFrequency: 'Horária',
  buildUrl: (date: string) => {
    return `https://.../LAYER/${date}/{z}/{y}/{x}.png`;
  }
};

// Adicione ao array SST_LAYERS
const SST_LAYERS: SSTLayer[] = [
  // ... camadas existentes
  NOVA_CAMADA
];
```

### Modificar Velocidades de Playback

```typescript
// Linha ~339
<select value={playbackSpeed} onChange={...}>
  <option value={2000}>0.5x (lento)</option>
  <option value={1000}>1x</option>
  <option value={500}>2x</option>
  <option value={250}>4x</option>
  <option value={125}>8x</option>
  <option value={62}>16x (muito rápido)</option>
</select>
```

### Alterar Intervalo Padrão

```typescript
// Linha ~73
const [dateRange, setDateRange] = useState({
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)..., // 30 dias
  end: new Date(Date.now() - 24 * 60 * 60 * 1000)...
});
```

---

## 🆚 Comparação com MultiSourceSSTMap

| Recurso | NASAWorldviewStyleMap | MultiSourceSSTMap |
|---------|----------------------|-------------------|
| **Timeline Animada** | ✅ Sim (com playback) | ❌ Não |
| **Controles de Velocidade** | ✅ 4 opções (1x-8x) | ❌ N/A |
| **Slider Temporal** | ✅ Sim | ❌ Não |
| **Intervalo de Datas** | ✅ Range customizável | ❌ Data única |
| **Camadas NASA GIBS** | ✅ 3 camadas MODIS | ❌ Apenas 1 |
| **Fallback Automático** | ❌ Não | ✅ 4 fontes |
| **Teste de Disponibilidade** | ❌ Não | ✅ Sim |
| **Interface** | 🛰️ NASA-style | 🌊 Ocean-style |
| **Foco** | Análise temporal | Robustez de fonte |

**Quando usar cada um**:
- **NASAWorldviewStyleMap**: Análise temporal, animações, estudos de eventos
- **MultiSourceSSTMap**: Confiabilidade, fallback, operação crítica

---

## 📝 Licença e Atribuições

Todos os dados são de domínio público:

- **NASA EOSDIS GIBS**: Open Data Policy
- **NOAA CoastWatch**: US Government Public Domain
- **MODIS**: NASA/GSFC/OBPG
- **JPL MUR**: NASA/JPL/PO.DAAC

Atribuições incluídas automaticamente nos mapas:
```
© NASA EOSDIS, NOAA, Esri, GEBCO
```

---

## 🆘 Suporte

### Dados NASA GIBS
- **Email**: support@earthdata.nasa.gov
- **Forum**: https://forum.earthdata.nasa.gov/

### Dados NOAA
- **Email**: coastwatch.info@noaa.gov
- **Phone**: +1-301-713-3272

### Documentação Adicional
- NASA Earthdata: https://www.earthdata.nasa.gov/
- NOAA CoastWatch: https://coastwatch.noaa.gov/

---

**Última atualização**: Dezembro 2025
**Versão**: 1.0.0
