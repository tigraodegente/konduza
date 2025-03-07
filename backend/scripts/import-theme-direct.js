/**
 * Script para importar um tema diretamente no Payload CMS
 * 
 * Este script carrega um arquivo JSON de tema e o importa diretamente
 * usando o Payload CMS API, sem precisar do endpoint HTTP.
 * 
 * Uso: node scripts/import-theme-direct.js ./examples/tema-exemplo.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPayload } from 'payload';
import dotenv from 'dotenv';

// Carregando variáveis de ambiente
dotenv.config();

// Obtendo o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar argumentos da linha de comando
const themePath = process.argv[2];
if (!themePath) {
  console.error('❌ É necessário fornecer o caminho para o arquivo JSON do tema.');
  console.error('Uso: node scripts/import-theme-direct.js ./examples/tema-exemplo.json');
  process.exit(1);
}

// Caminho absoluto para o arquivo JSON
const themeFilePath = path.resolve(process.cwd(), themePath);

// Função principal
async function importTheme() {
  console.log(`🚀 Iniciando importação do tema de: ${themeFilePath}`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(themeFilePath)) {
      console.error(`❌ Arquivo não encontrado: ${themeFilePath}`);
      process.exit(1);
    }
    
    // Ler o arquivo JSON
    const themeContent = fs.readFileSync(themeFilePath, 'utf8');
    const themeData = JSON.parse(themeContent);
    
    console.log(`✅ Arquivo JSON lido com sucesso: ${themeData.data.name}`);
    
    // Inicializar o Payload CMS
    console.log(`🔄 Inicializando Payload CMS...`);
    const payload = await getPayload({
      local: true,
      autoPopulatePaths: true,
    });
    
    console.log(`✅ Payload CMS inicializado com sucesso.`);
    
    // Verificar se o tema já existe
    const themeName = themeData.data.name;
    const existingThemes = await payload.find({
      collection: 'themes',
      where: {
        name: {
          equals: themeName
        }
      }
    });
    
    let themeId;
    let operation;
    
    if (existingThemes.docs.length > 0) {
      const existingTheme = existingThemes.docs[0];
      console.log(`🔄 Tema "${themeName}" já existe (ID: ${existingTheme.id}). Atualizando...`);
      
      // Atualizar o tema existente
      const updatedTheme = await payload.update({
        collection: 'themes',
        id: existingTheme.id,
        data: themeData.data
      });
      
      themeId = updatedTheme.id;
      operation = 'update';
    } else {
      console.log(`🔄 Criando novo tema: "${themeName}"`);
      
      // Criar um novo tema
      const newTheme = await payload.create({
        collection: 'themes',
        data: themeData.data
      });
      
      themeId = newTheme.id;
      operation = 'create';
    }
    
    console.log(`✅ Tema ${operation === 'update' ? 'atualizado' : 'criado'} com sucesso!`);
    console.log(`📋 Detalhes do tema:`);
    console.log(`   - ID: ${themeId}`);
    console.log(`   - Nome: ${themeName}`);
    console.log(`   - Versão: ${themeData.data.version}`);
    console.log(`   - Status: ${themeData.data.status}`);
    
    // Encerrar a conexão com o banco de dados
    await payload.db.destroy();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Erro ao importar tema:`);
    console.error(error);
    process.exit(1);
  }
}

// Executar a função principal
importTheme();