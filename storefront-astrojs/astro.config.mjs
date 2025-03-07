import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    tailwind(),
    react(),
    svelte()
  ],
  server: {
    port: 4321,
    host: true
  },
  vite: {
    ssr: {
      noExternal: ['@astrojs/react', '@astrojs/svelte']
    }
  },
  middleware: [
    {
      name: 'domain-detection',
      order: 'pre',
      callback: async ({ request, locals }) => {
        // Obter domínio da requisição
        const host = request.headers.get('host') || 'localhost:4321';
        const domain = host.split(':')[0]; // Remover porta, se houver
        
        try {
          // Importar funções para detecção de domínio
          const { getCurrentSite } = await import('./src/utils/api.js');
          
          // Obter configurações do site para este domínio
          const site = await getCurrentSite(domain);
          
          // Guardar informações do site para uso nas páginas
          locals.site = site;
          locals.domain = domain;
          
          // Se não encontrou o site e não é localhost, redirecionar para fallback
          if (!site && domain !== 'localhost' && domain !== '127.0.0.1') {
            console.warn(`Site não encontrado para o domínio: ${domain}`);
            // Poderia redirecionar para um domínio padrão ou exibir página de 404
            // return Response.redirect('https://konduza.com', 302);
          }
        } catch (error) {
          console.error(`Erro no middleware de detecção de domínio: ${error}`);
        }
      }
    }
  ]
});