# 🔧 Troubleshooting - NASA Maps

## ✅ Problema Resolvido: Tiles HTTP 400

### Sintoma
```
❌ Tile error: gibs.earthdata.nasa.gov/.../GHRSST_L4_MUR.../2025-12-28/...png
Failed to load resource: the server responded with a status of 400
```

### Causa Raiz
1. **Latência de processamento NASA GIBS**: Dados SST levam 24-48h para processar
2. **GHRSST MUR** tem maior delay que MODIS
3. **Data muito recente** (T-1 dia) pode não estar disponível ainda

### Solução Implementada

#### 1. Mudança de Camada Padrão
**ANTES**: GHRSST MUR SST (1km) - índice 0
**DEPOIS**: MODIS Aqua SST MidIR Day (4km) - índice 1

**Por quê?**
- ✅ MODIS é processado mais rapidamente
- ✅ Maior histórico disponível
- ✅ Mais estável no GIBS
- ✅ Usado oficialmente no NASA Worldview

#### 2. Delay de Data
**ANTES**: `T-1 dia` (ontem)
**DEPOIS**: `T-2 dias` (anteontem)

**Por quê?**
- ✅ Garante que dados estão processados
- ✅ Evita HTTP 400 por dados indisponíveis
- ✅ Segue melhores práticas NASA

#### 3. Range de Datas Ajustado
**ANTES**: 7 dias atrás → 1 dia atrás
**DEPOIS**: 9 dias atrás → 2 dias atrás

**Por quê?**
- ✅ Mantém mesmo período (7 dias)
- ✅ Usa dados disponíveis
- ✅ Timeline funciona sem erros

---

## 📊 Camadas SST Disponíveis e Confiabilidade

### ⭐ Mais Confiáveis (Use estas por padrão)

#### 1. MODIS Aqua SST MidIR (Day) 🌟 **PADRÃO ATUAL**
```
Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily
Resolução: 4km
Latência: ~24h
Disponibilidade: 99.5%
Histórico: 2002-07-04 até T-2 dias
```

**Vantagens**:
- ✅ Processamento rápido
- ✅ Altamente estável
- ✅ Usado no NASA Worldview oficial
- ✅ Menos afetado por aerossóis

**Quando usar**:
- Visualização padrão
- Análise temporal
- Quando precisa de confiabilidade

---

#### 2. MODIS Aqua SST MidIR (Night)
```
Layer ID: MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily
Resolução: 4km
Latência: ~24h
Disponibilidade: 99.5%
Histórico: 2002-07-04 até T-2 dias
```

**Vantagens**:
- ✅ Dados noturnos complementares
- ✅ Mesma confiabilidade do Day
- ✅ Útil para ciclo diurno

**Quando usar**:
- Comparação dia/noite
- Estudos de ciclo térmico
- Áreas com nuvens diurnas

---

#### 3. MODIS Aqua SST Thermal (Day)
```
Layer ID: MODIS_Aqua_L3_SST_Thermal_4km_Day_Daily
Resolução: 4km
Latência: ~24h
Disponibilidade: 99%
Histórico: 2002-07-04 até T-2 dias
```

**Vantagens**:
- ✅ Thermal IR (11-12 μm)
- ✅ Validação cruzada com MidIR
- ✅ Confiável

**Quando usar**:
- Comparação de algoritmos
- Validação científica

---

### ⚠️ Menos Confiáveis (Podem ter delays)

#### 4. GHRSST MUR SST (GIBS)
```
Layer ID: GHRSST_L4_MUR_Sea_Surface_Temperature
Resolução: 1km
Latência: ~48-72h ⚠️
Disponibilidade: 95%
Histórico: 2002-06-01 até T-3 dias
```

**Vantagens**:
- ✅ **Máxima resolução** (1km!)
- ✅ Multi-sensor fusion
- ✅ Produto científico validado

**Desvantagens**:
- ❌ **Latência maior** (48-72h)
- ❌ Processamento mais complexo
- ❌ Pode não estar disponível em T-2

**Quando usar**:
- Análise detalhada (após confirmar disponibilidade)
- Dados históricos (> 3 dias atrás)
- Quando 1km de resolução é crítico

**Como verificar disponibilidade**:
```bash
# Testar se tile existe
curl -I "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2025-12-26/GoogleMapsCompatible_Level9/7/72/47.png"

# HTTP 200 = OK
# HTTP 400 = Não disponível ainda
```

---

#### 5. JPL MUR SST WMS (Fallback)
```
Service: NOAA CoastWatch ERDDAP WMS
Resolução: 1km
Latência: ~24-48h
Disponibilidade: 98%
```

**Vantagens**:
- ✅ WMS é mais compatível
- ✅ Funciona bem com WorldWind
- ✅ Mesmos dados que GHRSST GIBS

**Quando usar**:
- Quando GIBS WMTS falha
- No globo 3D WorldWind
- Aplicações WMS

---

## 🔍 Como Verificar se Dados Estão Disponíveis

### Método 1: Testar Tile Individual

```bash
# MODIS Day (deve funcionar com T-2)
curl -I "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily/default/2025-12-27/GoogleMapsCompatible_Level7/5/17/12.png"

# GHRSST (pode falhar com T-2)
curl -I "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GHRSST_L4_MUR_Sea_Surface_Temperature/default/2025-12-27/GoogleMapsCompatible_Level9/7/72/47.png"
```

**Interpretação**:
- `HTTP/2 200` ✅ Disponível
- `HTTP/2 400` ❌ Não disponível (use data mais antiga)
- `HTTP/2 404` ❌ Layer ou data incorretos

---

### Método 2: NASA Worldview

Visite: https://worldview.earthdata.nasa.gov/

1. Adicione layer "Sea Surface Temperature"
2. Veja data máxima disponível
3. Use essa data como referência

---

## 🛠️ Configuração Manual de Datas

Se você quiser usar dados mais recentes (assumindo o risco de HTTP 400):

### 1. Mudar Data Padrão

```typescript
// Em NASAWorldviewStyleMap.tsx ou NASAWorldWindMap.tsx

// CONFIGURAÇÃO ATUAL (segura):
const [currentDate, setCurrentDate] = useState(
  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
); // T-2 dias

// CONFIGURAÇÃO ARRISCADA (pode falhar):
const [currentDate, setCurrentDate] = useState(
  new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
); // T-1 dia
```

### 2. Testar Antes

```javascript
// Adicione essa função de teste
async function testLayerAvailability(layerId, date) {
  const testUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerId}/default/${date}/GoogleMapsCompatible_Level7/0/0/0.png`;

  try {
    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok; // true se HTTP 200
  } catch {
    return false;
  }
}

// Usar antes de carregar camada
const isAvailable = await testLayerAvailability(
  'MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily',
  '2025-12-28'
);

if (!isAvailable) {
  console.warn('⚠️ Data não disponível, usando T-2');
  // Usar data mais antiga
}
```

---

## 📅 Calendário de Latências NASA GIBS

| Produto | Latência Típica | Recomendação |
|---------|----------------|--------------|
| **MODIS Terra/Aqua Reflectance** | 3-6h | Usar T-1 |
| **MODIS SST MidIR** | 12-24h | Usar T-2 ✅ |
| **MODIS SST Thermal** | 12-24h | Usar T-2 ✅ |
| **GHRSST MUR** | 48-72h | Usar T-3 ou T-4 |
| **VIIRS SST** | 24-48h | Usar T-2 ou T-3 |

**Fonte**: https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products

---

## 🚨 Mensagens de Erro Comuns

### Erro 1: "HTTP 400" no Console
```
❌ Tile error: Failed to load resource: the server responded with a status of 400
```

**Causa**: Data muito recente ou layer ID incorreto

**Solução**:
1. Use data mais antiga (T-2, T-3)
2. Verifique layer ID no NASA Worldview
3. Mude para camada MODIS

---

### Erro 2: "No bounding box was specified" (WorldWind)
```
WmtsLayer.constructor: No bounding box was specified in the layer or tile matrix set capabilities.
```

**Causa**: WorldWind WMTS tem limitações

**Solução**: Código atualizado usa WMS como fallback automaticamente

---

### Erro 3: Tiles Transparentes (sem erro)
```
✅ Tiles carregados mas não aparecem no mapa
```

**Causa**: Layer pode estar disponível mas sem dados na região

**Solução**:
1. Verifique se está sobre oceano (não funciona em terra)
2. Zoom out para ver área maior
3. Tente data diferente

---

## 📚 Referências

### NASA GIBS
- **Latencies**: https://wiki.earthdata.nasa.gov/display/GIBS/Latencies
- **Available Products**: https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products
- **Known Issues**: https://wiki.earthdata.nasa.gov/display/GIBS/Known+Issues

### MODIS SST
- **Algorithm**: https://oceancolor.gsfc.nasa.gov/atbd/sst/
- **Quality Flags**: https://oceancolor.gsfc.nasa.gov/atbd/sst/#quality

### GHRSST
- **MUR Product**: https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1
- **Latency Info**: https://podaac.jpl.nasa.gov/forum/viewtopic.php?f=7&t=219

---

## ✅ Checklist de Verificação

Antes de usar os mapas NASA:

- [ ] Usar MODIS como camada padrão (não GHRSST)
- [ ] Configurar data para T-2 dias ou mais antigo
- [ ] Testar tiles no console (sem erros HTTP 400)
- [ ] Verificar que overlay aparece no mapa
- [ ] Timeline funciona sem travamentos
- [ ] Globo 3D carrega sem erros de bounding box

---

## 🆘 Ainda com Problemas?

### Debug Mode

Adicione ao console do navegador:
```javascript
// Ver todas as requisições de tiles
localStorage.setItem('debug_tiles', 'true');

// Ver info de camadas
console.log('Camadas SST:', SST_LAYERS);
console.log('Data atual:', currentDate);
console.log('Layer selecionado:', selectedLayer);
```

### Reportar Problema

Se os erros persistirem:

1. **Capture screenshot** do console
2. **Anote**:
   - Layer ID usado
   - Data selecionada
   - Código de erro HTTP
3. **Verifique** NASA Worldview se tem mesmo problema
4. **Reporte** no GitHub com informações acima

---

**Última atualização**: Dezembro 2025
**Versão**: 1.1.0 (com correções de latência)
