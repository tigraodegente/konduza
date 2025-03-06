// Importação direta de tema usando a API do Payload

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import payload from 'payload';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Obter caminho do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTheme() {
  // Inicializar o Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'unsecure-secret-key',
    local: true,
    mongoURL: process.env.DATABASE_URI || ''
  });

  try {
    console.log('🚀 Iniciando importação direta de tema');

    // Primeiro, encontrar um usuário admin para ser o autor
    const adminUsers = await payload.find({
      collection: 'users',
      where: {
        'roles': {
          contains: 'admin'
        }
      },
      limit: 1
    });

    if (adminUsers.docs.length === 0) {
      console.error('❌ Nenhum usuário admin encontrado. Crie um usuário admin antes de importar temas.');
      process.exit(1);
    }

    const adminUserId = adminUsers.docs[0].id;
    console.log(`✅ Usuário admin encontrado: ${adminUsers.docs[0].name} (ID: ${adminUserId})`);

    // Dados do tema para importação
    const themeData = {
      name: "Tema Teste Import Direto",
      description: "Um tema para teste importado diretamente pelo script",
      version: "1.0.0",
      status: "draft",
      author: adminUserId, // ID do usuário admin
      mainStyles: "body { font-family: sans-serif; }",
      layouts: [
        {
          name: "Layout Base",
          key: "base",
          isDefault: true,
          template: "<html><body>{content}</body></html>"
        }
      ],
      components: [
        {
          name: "Hero",
          key: "hero",
          description: "Componente hero",
          category: "content",
          template: "<div class=\"hero\">{title}</div>"
        }
      ],
      settings: {
        colors: [
          {
            name: "Primária",
            key: "primary",
            value: "#3498db"
          }
        ]
      }
    };

    // Criar o tema no Payload
    const createdTheme = await payload.create({
      collection: 'themes',
      data: themeData
    });

    console.log('✅ Tema importado com sucesso:');
    console.log(`   ID: ${createdTheme.id}`);
    console.log(`   Nome: ${createdTheme.name}`);
    console.log(`   Status: ${createdTheme.status}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao importar tema:', error);
    process.exit(1);
  }
}

// Executar a função principal
importTheme();