/**
 * Script para importar um tema no Konduza
 * 
 * Este script demonstra como usar o endpoint de importação
 * enviando um arquivo JSON de tema para o servidor.
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';
const THEME_FILE = process.argv[2] || '../examples/tema-exemplo.json';

// Obter diretório atual para resolver caminhos relativos
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function importTheme() {
  try {
    console.log('🚀 Iniciando importação de tema...');
    
    // Resolver caminho do arquivo de tema
    const themePath = path.resolve(__dirname, THEME_FILE);
    console.log(`📁 Lendo arquivo: ${themePath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(themePath)) {
      console.error(`❌ Arquivo não encontrado: ${themePath}`);
      console.log('Uso: node import-theme.js [caminho-para-arquivo-json]');
      process.exit(1);
    }
    
    // Ler o arquivo JSON
    const themeJSON = fs.readFileSync(themePath, 'utf8');
    const themeData = JSON.parse(themeJSON);
    
    console.log(`📝 Tema carregado: ${themeData.data.name}`);
    
    // Enviar para o endpoint
    console.log(`🔌 Enviando para: ${API_URL}/import-data`);
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Adicionar chave de API se disponível
    if (INTERNAL_API_KEY) {
      config.headers['X-API-Key'] = INTERNAL_API_KEY;
      console.log('🔑 Usando chave de API para autenticação');
    } else {
      console.log('⚠️ Nenhuma chave de API definida. A solicitação pode falhar se o endpoint exigir autenticação.');
    }
    
    // Fazer a requisição
    const response = await axios.post(`${API_URL}/import-data`, themeData, config);
    
    // Mostrar resultado
    console.log('✅ Tema importado com sucesso:');
    console.log(`ID: ${response.data.data.id}`);
    console.log(`Nome: ${response.data.data.name}`);
    console.log(`Status: ${response.data.data.status}`);
    console.log(`Operação: ${response.data.operation}`);
    
    if (response.data.operation === 'update') {
      console.log('ℹ️ O tema já existia e foi atualizado.');
    }
    
    console.log(`\nVocê pode acessar o tema no painel admin: http://localhost:3000/admin/collections/themes/${response.data.data.id}`);
    
  } catch (error) {
    console.error('❌ Erro ao importar tema:');
    
    if (error.response) {
      // O servidor respondeu com um código de erro
      console.error(`Status: ${error.response.status}`);
      console.error('Detalhes:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro de conexão: O servidor Payload está em execução?');
      console.error('Certifique-se de que o servidor Payload está rodando com "npm run dev"');
    } else {
      // Erro ao configurar a requisição
      console.error(`Erro: ${error.message}`);
    }
  }
}

// Executar a função principal
importTheme();