#\!/bin/bash

# Verificar se o diretório é um repositório git
if [ \! -d "/Users/gustavoferro/konduza/.git" ]; then
  # Inicializar repositório se não existir
  cd /Users/gustavoferro/konduza
  git init
  git remote add origin https://github.com/tigraodegente/konduza.git
else
  cd /Users/gustavoferro/konduza
fi

# Adicionar arquivos modificados
git add backend/src/endpoints/import-data.ts
git add backend/src/endpoints/theme-validation.ts
git add backend/src/endpoints/admin-check.ts
git add storefront-astrojs/src/pages/api/theme-import.js
git add backend/scripts/test-endpoint.js
git add backend/scripts/test-import.js

# Criar o commit com mensagem detalhada
git commit -m "fix: correções de compatibilidade para endpoints no Next.js 15" -m "Este commit resolve problemas de compatibilidade entre o Payload CMS e Next.js 15 na manipulação de endpoints personalizados.

Mudanças principais:
- Atualização dos endpoints para usar o formato de resposta compatível com Next.js 15
- Refatoração dos manipuladores de endpoint para retornar objetos { status, body } em vez de chamar métodos res.json()
- Adição de tratamento adequado do body da requisição para endpoints de importação de dados
- Implementação de busca automática de autor para temas quando não fornecido
- Adiciona tratamento de erros mais robusto em endpoints
- Corrige problemas de serialização JSON nas respostas

Essas mudanças permitem que as funcionalidades de importação e validação de temas funcionem corretamente na versão 15 do Next.js, que mudou seu modelo de roteamento interno.

Tecnologias: TypeScript, Payload CMS, Next.js 15"

# Instruções para push (descomentadas apenas quando estiver pronto para push)
# git push -u origin master

echo "Commit criado com sucesso\! Para enviar ao GitHub, execute: git push -u origin main"

