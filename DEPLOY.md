# 🚀 Guia de Deploy - Ocean Data Pipeline

Este guia fornece instruções passo a passo para fazer o deploy do projeto na Vercel.

## 📋 Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se de que:

- [ ] Você tem uma conta no [Copernicus Marine Service](https://data.marine.copernicus.eu/register)
- [ ] Você tem uma conta na [Vercel](https://vercel.com)
- [ ] Seu repositório está no GitHub/GitLab/Bitbucket
- [ ] Todas as dependências estão instaladas (`npm install`)
- [ ] O build local funciona (`npm run build`)

## 🔑 Obter Credenciais da Copernicus

### 1. Criar conta na Copernicus Marine Service

1. Acesse: https://data.marine.copernicus.eu/register
2. Preencha o formulário de registro
3. Confirme seu email
4. Faça login em: https://data.marine.copernicus.eu/

### 2. Anotar suas credenciais

Após criar a conta, você terá:
- **Username**: Seu nome de usuário
- **Password**: Sua senha

**IMPORTANTE**: Guarde essas credenciais em um local seguro. Você precisará delas para o deploy.

## 🌐 Deploy na Vercel

### Método 1: Deploy via Dashboard (Mais Fácil)

#### Passo 1: Preparar o Repositório

1. Faça commit de todas as suas alterações:
```bash
git add .
git commit -m "feat: Add Copernicus integration and Vercel config"
git push origin main
```

#### Passo 2: Conectar com a Vercel

1. Acesse https://vercel.com e faça login
2. Clique em **"Add New..."** → **"Project"**
3. Selecione seu repositório Git
4. Clique em **"Import"**

#### Passo 3: Configurar o Projeto

Na tela de configuração:

**Framework Preset**: Vite
**Root Directory**: `./` (deixe em branco)
**Build Command**: `npm run build`
**Output Directory**: `dist`

#### Passo 4: Adicionar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

| Nome | Valor | Environment |
|------|-------|-------------|
| `VITE_COPERNICUS_USERNAME` | seu_usuario_copernicus | Production |
| `VITE_COPERNICUS_PASSWORD` | sua_senha_copernicus | Production |
| `VITE_API_MODE` | production | Production |

**DICA**: Clique em "Add Another" para adicionar mais variáveis.

#### Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (geralmente 2-3 minutos)
3. Após conclusão, você receberá uma URL: `https://seu-projeto.vercel.app`

### Método 2: Deploy via CLI (Avançado)

#### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

#### Passo 2: Login

```bash
vercel login
```

Escolha seu método de autenticação (GitHub, GitLab, etc.)

#### Passo 3: Deploy

```bash
vercel
```

Responda às perguntas:
- **Set up and deploy?** → Y
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → N
- **Project name?** → ocean-data-pipeline (ou seu nome preferido)
- **In which directory is your code located?** → `./`

#### Passo 4: Adicionar Variáveis de Ambiente

```bash
# Adicionar username da Copernicus
vercel env add VITE_COPERNICUS_USERNAME production
# Cole seu username quando solicitado

# Adicionar password da Copernicus
vercel env add VITE_COPERNICUS_PASSWORD production
# Cole sua senha quando solicitado

# Adicionar modo da API
vercel env add VITE_API_MODE production
# Digite: production
```

#### Passo 5: Fazer Deploy de Produção

```bash
vercel --prod
```

## ✅ Verificar o Deploy

### 1. Testar a Aplicação

1. Acesse a URL fornecida pela Vercel
2. Verifique se o dashboard carrega
3. Selecione diferentes estações
4. Confirme que os dados estão sendo exibidos

### 2. Verificar a Integração com Copernicus

Abra o console do navegador (F12) e verifique:

```javascript
// Deve aparecer no console:
// - Requisições para /api/copernicus
// - Resposta com "source": "copernicus" (se em modo production)
```

### 3. Monitorar Logs

Na dashboard da Vercel:
1. Vá em **"Deployments"** → Selecione seu deploy
2. Clique em **"Functions"**
3. Selecione `/api/copernicus`
4. Veja os logs de execução

## 🔧 Configurações Avançadas

### Domínio Customizado

1. Na dashboard da Vercel, vá em **"Settings"** → **"Domains"**
2. Clique em **"Add"**
3. Digite seu domínio
4. Siga as instruções para configurar DNS

### Variáveis de Ambiente para Preview

Para usar dados reais também nos deploys de preview:

```bash
vercel env add VITE_COPERNICUS_USERNAME preview
vercel env add VITE_COPERNICUS_PASSWORD preview
vercel env add VITE_API_MODE preview
```

### Analytics

Habilitar Vercel Analytics:

1. Vá em **"Analytics"** no projeto
2. Clique em **"Enable"**
3. Instale o pacote:
```bash
npm install @vercel/analytics
```

4. Adicione ao `App.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// No componente:
<Analytics />
```

## 🐛 Troubleshooting

### Erro: "Build Failed"

**Solução**:
```bash
# Limpar cache e tentar novamente
vercel --force
```

### Erro: "Module not found"

**Solução**:
```bash
# Verificar dependências
npm install
npm run build

# Se funcionar localmente, fazer commit e redeploy
git add package-lock.json
git commit -m "fix: Update dependencies"
git push
```

### Erro: "Copernicus API Error"

**Possíveis causas**:
1. Credenciais inválidas → Verifique username/password
2. Variáveis não configuradas → Adicione via dashboard
3. Conta Copernicus não ativada → Verifique email de confirmação

**Solução**:
```bash
# Atualizar variáveis
vercel env rm VITE_COPERNICUS_USERNAME production
vercel env add VITE_COPERNICUS_USERNAME production

vercel env rm VITE_COPERNICUS_PASSWORD production
vercel env add VITE_COPERNICUS_PASSWORD production

# Redeploy
vercel --prod
```

### Timeout na API Serverless

A Vercel tem limite de 10 segundos para funções serverless no plano gratuito.

**Solução**: Otimizar requisições ou fazer upgrade do plano.

## 📊 Monitoramento

### Verificar Performance

1. **Vercel Analytics**: Métricas de performance e usage
2. **Browser DevTools**:
   - Network tab para verificar tempo de resposta
   - Performance tab para análise de rendering

### Logs de Erro

```bash
# Ver logs em tempo real
vercel logs ocean-data-pipeline --follow
```

## 🔄 Atualizações Contínuas

### Deploy Automático

A Vercel faz deploy automático quando você:
1. Faz push para a branch `main` (produção)
2. Cria um Pull Request (preview deploy)

### Rollback

Se algo der errado:

1. Na dashboard, vá em **"Deployments"**
2. Encontre o deploy anterior funcionando
3. Clique nos 3 pontos → **"Promote to Production"**

## 📚 Recursos

- [Vercel Documentation](https://vercel.com/docs)
- [Copernicus Marine Help](https://help.marine.copernicus.eu/)
- [Vite Production Build](https://vite.dev/guide/build.html)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs da Vercel
2. Teste localmente com `npm run build && npm run preview`
3. Consulte a documentação da Copernicus
4. Abra uma issue no GitHub do projeto

---

**Última atualização**: 2025-12-27
