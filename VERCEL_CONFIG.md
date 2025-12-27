# ⚙️ Configuração de Variáveis de Ambiente na Vercel

## 📋 Variáveis Necessárias

Para ativar a integração com a API da Copernicus Marine Service, você precisa configurar estas **3 variáveis** na Vercel:

### 1. Credenciais da Copernicus

| Variável | Valor | Onde Encontrar |
|----------|-------|----------------|
| `COPERNICUSMARINE_SERVICE_USERNAME` | Seu username | https://data.marine.copernicus.eu/register |
| `COPERNICUSMARINE_SERVICE_PASSWORD` | Sua senha | (mesma conta acima) |

### 2. Modo da API

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `VITE_API_MODE` | `production` | Ativa dados reais da Copernicus |

**Importante:** Se você deixar `VITE_API_MODE=demo` ou não configurar, o app usará dados simulados (Open-Meteo API).

---

## 🚀 Como Configurar na Vercel

### Opção 1: Via Dashboard (Recomendado)

1. Acesse seu projeto na [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as 3 variáveis:

```
Nome: COPERNICUSMARINE_SERVICE_USERNAME
Valor: seu_usuario_copernicus
Environment: Production, Preview, Development
```

```
Nome: COPERNICUSMARINE_SERVICE_PASSWORD
Valor: sua_senha_copernicus
Environment: Production, Preview, Development
```

```
Nome: VITE_API_MODE
Valor: production
Environment: Production, Preview
```

4. Clique em **Save**
5. Faça um novo deploy (ou aguarde o próximo push)

### Opção 2: Via CLI

```bash
# Adicionar credenciais
vercel env add COPERNICUSMARINE_SERVICE_USERNAME production
# Cole seu username quando solicitado

vercel env add COPERNICUSMARINE_SERVICE_PASSWORD production
# Cole sua senha quando solicitado

vercel env add VITE_API_MODE production
# Digite: production
```

---

## ✅ Verificar se Está Funcionando

### 1. Após Deploy

Acesse seu site na Vercel e abra o **DevTools (F12)** → **Console**

Você deve ver:
```
🔐 Using Copernicus credentials for user: seu_usuario
📡 Open-Meteo API Response for lat: -24 lon: -45 {...}
```

### 2. Verificar Modo da API

No console, procure por mensagens indicando a fonte dos dados:

**Modo Demo (dados simulados):**
```json
{
  "source": "demo",
  "message": "Using demonstration data..."
}
```

**Modo Produção (dados reais da Copernicus):**
```json
{
  "source": "copernicus",
  "data": {
    "temperature": 24.5,
    "salinity": 35.2,
    ...
  }
}
```

### 3. Testar a API Diretamente

Acesse:
```
https://seu-projeto.vercel.app/api/copernicus?lat=-24&lon=-45
```

Deve retornar JSON com dados oceanográficos.

---

## 🐛 Troubleshooting

### Erro: "Copernicus credentials not configured"

**Problema:** As variáveis de ambiente não estão configuradas ou com nomes errados.

**Solução:**
1. Verifique se as variáveis estão no dashboard da Vercel
2. Nomes corretos: `COPERNICUSMARINE_SERVICE_USERNAME` e `COPERNICUSMARINE_SERVICE_PASSWORD`
3. Faça um novo deploy após adicionar

### Dados ainda são simulados

**Problema:** `VITE_API_MODE` não está configurado ou está como `demo`.

**Solução:**
1. Adicione `VITE_API_MODE=production` na Vercel
2. Redeploy do projeto

### Erro 401/403 na API da Copernicus

**Problema:** Credenciais inválidas ou conta não ativada.

**Solução:**
1. Verifique se confirmou o email da conta Copernicus
2. Tente fazer login em https://data.marine.copernicus.eu/
3. Verifique se copiou username/password corretamente (sem espaços)

### Build com sucesso mas dados não atualizam

**Problema:** Cache do navegador ou variáveis não recarregadas.

**Solução:**
1. Limpe cache do navegador (Ctrl+Shift+Delete)
2. Force novo deploy na Vercel:
   ```bash
   vercel --force --prod
   ```

---

## 📊 Nomes de Variáveis Suportados

A API serverless aceita múltiplos nomes (por compatibilidade):

### Para Username:
- ✅ `COPERNICUSMARINE_SERVICE_USERNAME` (recomendado)
- ✅ `COPERNICUS_USERNAME`
- ✅ `VITE_COPERNICUS_USERNAME`

### Para Password:
- ✅ `COPERNICUSMARINE_SERVICE_PASSWORD` (recomendado)
- ✅ `COPERNICUS_PASSWORD`
- ✅ `VITE_COPERNICUS_PASSWORD`

**Use apenas um conjunto de nomes.** O sistema tentará na ordem acima.

---

## 🔒 Segurança

✅ **As credenciais são seguras:**
- Armazenadas criptografadas na Vercel
- Nunca expostas ao cliente/navegador
- Usadas apenas na função serverless
- Logs não mostram senhas (apenas username)

❌ **NUNCA:**
- Commitar credenciais no código
- Compartilhar suas credenciais
- Usar credenciais em variáveis VITE_ (são expostas ao cliente)

---

## 📚 Links Úteis

- [Criar conta Copernicus](https://data.marine.copernicus.eu/register)
- [Documentação Copernicus](https://help.marine.copernicus.eu/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Logs da Vercel](https://vercel.com/docs/concepts/observability/logging)

---

**Última atualização:** 2025-12-27
