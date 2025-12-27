# 🌊 Ocean Data Pipeline - Copernicus Marine Integration

Sistema de monitoramento oceanográfico integrado com a API da Copernicus Marine Service para visualização de dados reais de temperatura, salinidade e clorofila dos oceanos.

## 🚀 Deploy Rápido na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/projeto-oceanografia-copernicus)

## 📋 Pré-requisitos

- Node.js 18+
- Conta no [Copernicus Marine Service](https://data.marine.copernicus.eu/register) (gratuita para fins educacionais)
- Conta na [Vercel](https://vercel.com) (gratuita)

## 🔧 Configuração Local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/projeto-oceanografia-copernicus.git
cd projeto-oceanografia-copernicus
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais:

```env
# Credenciais da Copernicus Marine Service
VITE_COPERNICUS_USERNAME=seu_usuario_copernicus
VITE_COPERNICUS_PASSWORD=sua_senha_copernicus

# Modo da API: 'production' para dados reais, 'demo' para demonstração
VITE_API_MODE=demo
```

### 4. Execute localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🌐 Deploy na Vercel

### Opção 1: Via CLI (Recomendado)

1. Instale a Vercel CLI:
```bash
npm install -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Configure as variáveis de ambiente:
```bash
vercel env add VITE_COPERNICUS_USERNAME
vercel env add VITE_COPERNICUS_PASSWORD
vercel env add VITE_API_MODE
```

### Opção 2: Via Dashboard da Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe seu repositório do GitHub
4. Configure as variáveis de ambiente:
   - `VITE_COPERNICUS_USERNAME`: Seu usuário do Copernicus
   - `VITE_COPERNICUS_PASSWORD`: Sua senha do Copernicus
   - `VITE_API_MODE`: `production` (para usar dados reais)
5. Clique em "Deploy"

## 📊 Modos de Operação

### Modo Demo (`VITE_API_MODE=demo`)
- Usa API Open-Meteo para dados de ondas
- Dados simulados para temperatura e salinidade
- Não requer credenciais Copernicus
- Ideal para testes e desenvolvimento

### Modo Produção (`VITE_API_MODE=production`)
- Conecta diretamente com Copernicus Marine Service
- Dados oceanográficos reais em tempo real
- Requer credenciais válidas
- Recomendado para uso em produção

## 🗺️ Recursos

- **Dashboard Principal**: Visão geral dos dados oceanográficos
- **Seleção de Estações**: Filtragem por região (Atlântico Sul, Costa Brasileira, Pacífico)
- **Visualizações em Tempo Real**:
  - Temperatura da superfície do mar (SST)
  - Salinidade
  - Concentração de clorofila
- **Detecção de Anomalias**: Identificação automática de padrões anormais
- **Gráficos Interativos**: Tendências horárias e mensais

## 🔐 Segurança

As credenciais da Copernicus são armazenadas de forma segura:
- No desenvolvimento: arquivo `.env.local` (não versionado)
- Na produção: Variáveis de ambiente da Vercel (encriptadas)
- As credenciais **nunca** são expostas ao cliente
- O proxy serverless (`/api/copernicus`) gerencia a autenticação

## 🛠️ Estrutura do Projeto

```
projeto-oceanografia-copernicus/
├── api/                    # Funções serverless (Vercel)
│   └── copernicus.ts      # Proxy para API Copernicus
├── components/             # Componentes React
│   ├── Layout.tsx
│   └── Visualizations.tsx
├── pages/                  # Páginas da aplicação
│   ├── Dashboard.tsx
│   └── Anomalies.tsx
├── services/              # Serviços de API
│   └── api.ts            # Integração com Copernicus
├── .env.example          # Template de variáveis de ambiente
├── vercel.json           # Configuração da Vercel
└── vite.config.ts        # Configuração do Vite
```

## 📡 API Endpoints

### `/api/copernicus`

Proxy serverless para a API da Copernicus Marine Service.

**Parâmetros:**
- `lat`: Latitude (padrão: -24.0)
- `lon`: Longitude (padrão: -45.0)
- `dataset`: ID do dataset Copernicus (opcional)

**Exemplo:**
```bash
GET /api/copernicus?lat=-23.5&lon=-45.2
```

**Resposta:**
```json
{
  "source": "copernicus",
  "data": {
    "temperature": 24.5,
    "salinity": 35.2,
    "chlorophyll": 0.42,
    "timestamp": "2025-12-27T14:30:00Z",
    "location": {
      "lat": -23.5,
      "lon": -45.2
    }
  }
}
```

## 🔍 Datasets da Copernicus Utilizados

- **Global Ocean Physics Analysis**: `cmems_mod_glo_phy_anfc_0.083deg_P1D-m`
  - Temperatura, Salinidade, Correntes
- **Global Ocean Biogeochemistry**: `cmems_mod_glo_bgc_anfc_0.25deg_P1D-m`
  - Clorofila, Nutrientes

## 🐛 Troubleshooting

### Erro: "Copernicus credentials not configured"
- Verifique se as variáveis `VITE_COPERNICUS_USERNAME` e `VITE_COPERNICUS_PASSWORD` estão configuradas
- Na Vercel, certifique-se de que as variáveis foram adicionadas nas configurações do projeto

### Dados não atualizam
- Verifique se `VITE_API_MODE=production`
- Confirme que suas credenciais Copernicus estão válidas
- Verifique os logs da função serverless na Vercel

### Build falha na Vercel
- Execute `npm run build` localmente para verificar erros
- Verifique se todas as dependências estão no `package.json`
- Confirme que a versão do Node.js é compatível (18+)

## 📚 Recursos Adicionais

- [Documentação Copernicus Marine](https://help.marine.copernicus.eu/)
- [Guia Vercel](https://vercel.com/docs)
- [Vite Documentation](https://vite.dev/)

## 📄 Licença

MIT

## 👥 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.
