# Lumus · by Branddi Monitor

Plataforma interna de inteligência de marca digital.

## Ferramentas

### Relatório Brand Bidding
- Wizard em 3 passos para montar relatórios semanais/quinzenais
- **IA automática:** cole o print do gráfico e a IA (Gemini) gera a análise estratégica
- Escolha entre 2 opções de análise ou edite livremente
- Botão "Regenerar análise" no preview
- Colar imagem com Ctrl+V, drag-and-drop ou upload
- Export para PDF e cópia de texto

### Resumo de Tratativa
- Cole a URL de um card do Pipefy
- A IA busca os dados via GraphQL e gera o resumo estruturado

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz (nunca suba no Git):

```env
GEMINI_API_KEY=AIzaSy...
```

**Como obter a chave Gemini (gratuita):**
1. Acesse https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em "Create API key"
4. Copie e cole no `.env.local`

## Deploy na Vercel

1. Suba este projeto no GitHub
2. Importe em vercel.com
3. Em **Environment Variables**, adicione `GEMINI_API_KEY`
4. Clique em Deploy

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Acesse http://localhost:3000
