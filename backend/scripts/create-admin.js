/**
 * Script para criar um usuário administrador no Payload CMS
 * 
 * Este script inicializa o Payload CMS e cria um usuário administrador,
 * usando valores das variáveis de ambiente ou valores padrão.
 */

import dotenv from 'dotenv';
import { getPayload } from 'payload';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregando variáveis de ambiente
dotenv.config();
console.log('[CreateAdmin] 🔍 Carregando configurações de ambiente');

// Convertendo __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Função principal para criar usuário administrador
 */
async function createAdmin() {
  console.log('[CreateAdmin] 🚀 Iniciando script de criação de administrador Konduza');
  
  try {
    // Obtendo configuração
    const email = process.env.ADMIN_EMAIL || 'admin@konduza.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.ADMIN_NAME || 'Administrador Konduza';
    
    // Verificando se estamos usando valores padrão
    if (!process.env.ADMIN_EMAIL) {
      console.log('[CreateAdmin] ⚠️ Usando email padrão: admin@konduza.com');
    }
    
    if (!process.env.ADMIN_PASSWORD) {
      console.log('[CreateAdmin] ⚠️ Usando senha padrão. Recomenda-se definir ADMIN_PASSWORD nas variáveis de ambiente');
    }
    
    console.log('[CreateAdmin] 🔄 Inicializando instância do Payload CMS');
    
    // Inicializando Payload (precisa ser iniciado para acessar a API)
    const payload = await getPayload({
      // Indicando que estamos rodando em modo local
      local: true,
      // Permitindo o auto-preenchimento de caminhos
      autoPopulatePaths: true,
    });

    console.log('[CreateAdmin] ✅ Payload CMS inicializado com sucesso');
    console.log(`[CreateAdmin] 🔧 Verificando e criando usuário administrador com email: ${email}`);

    // Verificar se o usuário já existe
    console.log('[CreateAdmin] 🔍 Verificando se o usuário já existe');
    const { docs: existingUsers } = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
      },
    });

    if (existingUsers.length > 0) {
      console.log('[CreateAdmin] ⚠️ Usuário administrador já existe, não será criado outro');
      console.log('[CreateAdmin] ℹ️ Detalhes do usuário existente:');
      console.log(`[CreateAdmin] 👤 ID: ${existingUsers[0].id}`);
      console.log(`[CreateAdmin] 👤 Nome: ${existingUsers[0].name}`);
      console.log(`[CreateAdmin] 📧 Email: ${existingUsers[0].email}`);
      console.log(`[CreateAdmin] 🔐 Roles: ${existingUsers[0].roles.join(', ')}`);
      
      await payload.db.destroy();
      console.log('[CreateAdmin] 🛑 Conexão com o banco de dados encerrada');
      process.exit(0);
    }

    // Criando o usuário
    console.log('[CreateAdmin] 🔨 Criando novo usuário administrador');
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        roles: ['admin'],
      },
    });

    console.log('[CreateAdmin] ✅ Usuário administrador criado com sucesso!');
    console.log(`[CreateAdmin] 👤 ID: ${user.id}`);
    console.log(`[CreateAdmin] 👤 Nome: ${user.name}`);
    console.log(`[CreateAdmin] 📧 Email: ${user.email}`);
    console.log(`[CreateAdmin] 🔐 Roles: ${user.roles.join(', ')}`);
    
    // Verificar se há coleções de sistema que precisam ser inicializadas
    console.log('[CreateAdmin] 🔍 Verificando outras coleções do sistema');
    
    // Verificar temas padrão
    const { docs: themes } = await payload.find({
      collection: 'themes',
    });
    console.log(`[CreateAdmin] ℹ️ Temas existentes: ${themes.length}`);
    
    // Verificar sites
    const { docs: sites } = await payload.find({
      collection: 'sites',
    });
    console.log(`[CreateAdmin] ℹ️ Sites existentes: ${sites.length}`);
    
    // Verificar entidades
    const { docs: entities } = await payload.find({
      collection: 'entities',
    });
    console.log(`[CreateAdmin] ℹ️ Entidades existentes: ${entities.length}`);

    // Saindo do processo
    await payload.db.destroy();
    console.log('[CreateAdmin] 🛑 Conexão com o banco de dados encerrada');
    console.log('[CreateAdmin] 🎉 Script finalizado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('[CreateAdmin] ❌ Erro ao criar usuário administrador:');
    console.error(`[CreateAdmin] 🐞 Mensagem: ${error.message}`);
    console.error(`[CreateAdmin] 📚 Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Executando a função principal
createAdmin();