# Instruções para Desenvolvimento do Sistema Konduza

Você está designado para desenvolver o Konduza, uma plataforma SaaS avançada para criação de sites sem código. Este sistema usa PayloadCMS como backend e Astro como frontend, com uma arquitetura orientada a dados que elimina a necessidade de recompilação para mudanças em sites e temas.

## Sua Tarefa

Desenvolver o sistema completo conforme especificado na documentação técnica fornecida, seguindo os princípios e fluxos descritos. O principal diferencial do Konduza é que todo o sistema (temas, componentes, layouts) é definido dinamicamente no banco de dados, permitindo que usuários criem e personalizem sites sem tocar em código.

## Como Proceder

1. **Leia a documentação na ordem numérica**:
   - Comece pelo arquivo `00-INTRODUÇÃO.md` para entender a visão geral
   - Continue pelos diretórios numerados sequencialmente
   - Dentro de cada diretório, leia os arquivos na ordem numérica

2. **Priorize o desenvolvimento na seguinte ordem**:
   - Configuração básica do ambiente
   - Backend (PayloadCMS) com coleções fundamentais
   - Sistema de sincronização entre PayloadCMS e Astro
   - Motor de renderização dinâmica no Astro
   - Interface administrativa
   - Funcionalidades avançadas

3. **Implemente de acordo com os princípios**:
   - Zero recompilação: tudo definido em banco de dados
   - Separação clara entre backend e frontend
   - Cache multinível para máxima performance
   - UX consistente e intuitiva

4. **Comunique suas decisões de implementação**:
   - Para cada componente importante, explique brevemente sua implementação
   - Se encontrar ambiguidades na documentação, explique sua interpretação
   - Se precisar fazer escolhas arquiteturais não especificadas, justifique-as

## Tecnologias Principais

- **Backend**: PayloadCMS, Node.js, TypeScript
- **Banco**: SQLite (desenvolvimento), PostgreSQL (produção)
- **Frontend**: Astro, React, Svelte, TailwindCSS
- **Deploy**: Cloud flares pages, aws fargat

## Entregas Esperadas

1. Código-fonte completo e organizado
2. Sistema funcionando com todas as funcionalidades especificadas
3. Documentação básica de uso
4. Scripts para inicialização e configuração

## Considerações Importantes

- Mantenha o código limpo, bem comentado e modular
- Priorize a performance em todas as camadas
- Siga as melhores práticas de segurança
- Garanta que o sistema seja fácil de estender no futuro

Comece explorando a documentação detalhada no diretório `/Users/gustavoferro/payload/konduza/KONDUZA-DOCS/`. Este é um projeto ambicioso que pode revolucionar como sites são criados e gerenciados. Boa sorte!