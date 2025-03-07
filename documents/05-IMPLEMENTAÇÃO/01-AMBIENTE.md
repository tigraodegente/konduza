# Configuração do Ambiente de Desenvolvimento

Este documento descreve como configurar o ambiente de desenvolvimento para o projeto Konduza, incluindo os requisitos, etapas de instalação e configuração.

## Requisitos do Sistema

Para desenvolver o Konduza, você precisará:

- **Node.js**: v18+ (LTS recomendado)
- **npm**: v8+ (vem com Node.js)
- **Git**: Para controle de versão
- **Docker** (opcional): Para desenvolvimento com containers

## Estrutura de Diretórios

```
/konduza/
├── astro/                 # Frontend com Astro
│   ├── public/            # Arquivos estáticos
│   ├── src/               # Código-fonte do Astro
│   ├── astro.config.mjs   # Configuração do Astro
│   └── package.json       # Dependências do frontend
├── src/                   # Backend com PayloadCMS
│   ├── collections/       # Definições de coleções
│   ├── endpoints/         # Endpoints customizados
│   ├── hooks/             # Hooks e middleware
│   ├── utils/             # Utilitários
│   └── payload.config.ts  # Configuração do PayloadCMS
├── payload-import-plugin.js  # Plugin de sincronização
├── package.json           # Dependências do projeto
└── docker-compose.yml     # Configuração Docker (se usado)
```

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/konduza.git
cd konduza
```

### 2. Instale as Dependências

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd astro
npm install
cd ..
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```
# Backend
PORT=3000
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_SECRET=seu_secret_para_jwt_aqui
INTERNAL_API_KEY=chave_para_comunicacao_interna

# Frontend
ASTRO_URL=http://localhost:4321
```

### 4. Configure o Banco de Dados

Por padrão, o Konduza usa SQLite em desenvolvimento. O arquivo de banco será criado automaticamente.

Para PostgreSQL em produção:

```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/konduza
```

## Executando o Projeto

### Método 1: Execução Direta

```bash
# Terminal 1: Backend (PayloadCMS)
npm run dev

# Terminal 2: Frontend (Astro)
cd astro
npm run dev
```

### Método 2: Script Completo

```bash
# Executa tanto o backend quanto o frontend
npm run start:all
```

### Método 3: Docker

```bash
docker-compose up
```

## Acessando o Sistema

- **Backend (PayloadCMS Admin)**: http://localhost:3000/admin
- **Frontend (Astro)**: http://localhost:4321
- **API (PayloadCMS)**: http://localhost:3000/api

## Criando o Primeiro Usuário Admin

Na primeira execução, acesse o painel admin e crie o primeiro usuário:

1. Navegue para http://localhost:3000/admin
2. Preencha o formulário de criação de usuário
3. Use credenciais fortes para este usuário administrador

Alternativamente, use o script de inicialização:

```bash
npm run init:user
```

## Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento do PayloadCMS
npm run dev

# Iniciar servidor de desenvolvimento do Astro
npm run dev:astro

# Iniciar ambos os servidores
npm run start:all

# Construir para produção
npm run build

# Gerar tipos TypeScript
npm run generate:types

# Criar primeiro usuário via script
npm run init:user

# Executar testes
npm run test
```

## Verificando a Instalação

Para confirmar que tudo está funcionando corretamente:

1. Acesse o painel admin do PayloadCMS: http://localhost:3000/admin
2. Faça login com o usuário criado
3. Verifique se as coleções Users, Media, Entities, Sites e Themes estão disponíveis
4. Acesse o frontend do Astro: http://localhost:4321
5. Verifique se a página inicial é exibida corretamente

## Solucionando Problemas Comuns

### Erro ao Conectar com o Banco de Dados

```bash
# Verificar se o arquivo de banco SQLite existe
ls konduza.db

# Remover banco e iniciar do zero se necessário
rm konduza.db
npm run dev
```

### Problemas de CORS

Verifique se as URLs estão configuradas corretamente no `payload.config.ts`:

```typescript
cors: [
  process.env.ASTRO_URL || 'http://localhost:4321',
],
```

### Erros no Astro

```bash
# Limpar cache e reinstalar dependências
cd astro
rm -rf node_modules .astro
npm install
```

## Dicas de Desenvolvimento

1. **Sempre execute o build do TypeScript** quando alterar tipos:
   ```bash
   npm run generate:types
   ```

2. **Use o modo desenvolvimento seguro** para limpar o cache quando necessário:
   ```bash
   npm run devsafe
   ```

3. **Monitore os logs** para identificar erros rapidamente:
   ```bash
   tail -f logs/konduza.log
   ```

4. **Utilize as ferramentas de desenvolvimento do navegador** para depurar o frontend.

## Próximos Passos

Após configurar o ambiente, você deve:

1. Familiarizar-se com a estrutura do projeto
2. Implementar as coleções fundamentais do PayloadCMS
3. Desenvolver o sistema de sincronização entre PayloadCMS e Astro

Continue explorando a documentação:
- `02-ESTRUTURA-ARQUIVOS.md` para entender a organização do código
- `03-PRIORIDADES.md` para ver o plano de desenvolvimento
- `../01-SISTEMA-COMPLETO/02-BACKEND/01-PAYLOAD-CONFIG.md` para iniciar a implementação do backend