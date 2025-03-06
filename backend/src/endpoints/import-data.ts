import { Endpoint } from 'payload/config'
import { validateAPIKey } from '../utils/validateAPIKey'

/**
 * Endpoint para importação genérica de dados via JSON
 * 
 * Este endpoint flexível recebe um JSON para importar qualquer tipo
 * de conteúdo (temas, entidades, sites, etc.) para o sistema.
 * 
 * Formato esperado do JSON:
 * {
 *   "type": "themes", // ou "entities", "sites", etc.
 *   "operation": "create" ou "update" ou "forcedCreate", // opcional, padrão é "create"
 *   "data": {
 *     // Dados do objeto a ser criado ou atualizado
 *   },
 *   "options": {
 *     // Opções adicionais para a importação (opcional)
 *     "skipValidation": false,
 *     "overrideExisting": false,
 *     "relationshipDepth": 1 // Profundidade para relacionamentos
 *   }
 * }
 */
const importDataEndpoint: Endpoint = {
  path: '/import-data', // Removi o prefixo /api que é adicionado automaticamente pelo Payload
  method: 'post',
  handler: async (req) => {

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Criando função de log contextual com requestId
    const log = (level, message, data = {}) => {
      const timestamp = new Date().toISOString()
      const prefix = `[ImportData][${requestId}][${timestamp}][${level}]`
      
      if (level === 'ERROR') {
        console.error(`${prefix} ${message}`, data)
      } else {
        console.log(`${prefix} ${message}`, data)
      }
    }
    
    try {
      log('INFO', 'Recebida requisição para importação de dados')
      
      // Verificar autenticação
      // TEMPORÁRIO: Desabilitamos a verificação da API key para facilitar o desenvolvimento
      // Em produção, essa verificação deve ser reativada
      log('INFO', 'Autenticação desabilitada temporariamente para desenvolvimento')
      
      // Log do objeto req para debug
      console.log('REQ object:', {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
        hasBody: !!req.body,
        bodyType: typeof req.body,
        body: req.body
      })
      /* 
      if (!req.user && !validateAPIKey(req)) {
        log('ERROR', 'Erro de autenticação: Usuário não autenticado ou chave de API inválida')
        return {
          statusCode: 401,
          body: {
            success: false,
            requestId,
            error: 'Não autorizado - É necessário estar autenticado ou fornecer uma chave de API válida',
          }
        }
      }
      */

      // Validar payload da requisição
      // Para Next.js 15, tentamos ler o JSON diretamente do corpo da requisição
      let jsonBody = {}
      
      try {
        // Se req.body é uma string ou ReadableStream, tentamos ler como JSON
        if (typeof req.body === 'string') {
          jsonBody = JSON.parse(req.body)
        } else if (req.body && typeof req.body.getReader === 'function') {
          // É um ReadableStream
          const reader = req.body.getReader()
          const decoder = new TextDecoder()
          let result = await reader.read()
          let chunks = []
          
          while (!result.done) {
            chunks.push(decoder.decode(result.value, { stream: true }))
            result = await reader.read()
          }
          
          // Último chunk
          chunks.push(decoder.decode())
          
          // Juntar tudo e parsear como JSON
          const bodyText = chunks.join('')
          console.log('Body text from stream:', bodyText)
          if (bodyText.trim()) {
            jsonBody = JSON.parse(bodyText)
          }
        } else if (req.body && typeof req.body === 'object') {
          // Se já for um objeto, usamos diretamente
          jsonBody = req.body
        }
        
        console.log('Parsed JSON body:', jsonBody)
      } catch (error) {
        log('ERROR', `Erro ao processar corpo da requisição: ${error.message}`)
        console.error('Error parsing body:', error)
      }
      
      const { type, operation = 'create', data, options = {} } = jsonBody
      
      if (!type || !data) {
        log('ERROR', 'Dados inválidos: Faltam campos obrigatórios', { type, hasData: !!data })
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            requestId,
            error: 'Dados inválidos - Os campos "type" e "data" são obrigatórios',
          })
        }
      }

      // Verificar se a coleção existe
      const collections = req.payload?.collections || {}
      if (!collections[type]) {
        log('ERROR', `Tipo inválido: "${type}" não é uma coleção válida`)
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            requestId,
            error: `Tipo inválido - "${type}" não é uma coleção válida no sistema`,
            availableTypes: Object.keys(collections),
          })
        }
      }

      log('INFO', `Processando importação`, { type, operation, options })

      // Manipular campos especiais e relacionamentos
      if (operation === 'create' || operation === 'forcedCreate') {
        if (type === 'themes') {
          // Para temas, precisamos garantir que o author seja preenchido corretamente
          if (!data.author) {
            // Tentar encontrar um usuário admin para associar como autor
            try {
              log('DEBUG', 'Buscando usuário admin para associar como autor do tema')
              
              const adminUsers = await req.payload.find({
                collection: 'users',
                where: {
                  'roles': {
                    contains: 'admin'
                  }
                },
                limit: 1
              })
              
              if (adminUsers.docs.length > 0) {
                const adminUserId = adminUsers.docs[0].id
                data.author = adminUserId
                log('DEBUG', `Definido autor do tema para usuário admin encontrado`, { adminUserId })
              } else if (req.user) {
                // Se não encontrou admin mas tem usuário logado, usa ele
                data.author = req.user.id
                log('DEBUG', `Definido autor do tema para o usuário autenticado`, { userId: req.user.id })
              } else {
                // Se não tem autor e não conseguiu encontrar um, loga o problema
                log('ERROR', 'Nenhum usuário admin encontrado e nenhum usuário autenticado para ser usado como autor')
                return {
                  status: 400,
                  body: JSON.stringify({
                    success: false,
                    requestId,
                    error: 'É necessário fornecer um ID de autor válido ou estar autenticado para criar um tema'
                  })
                }
              }
            } catch (error) {
              log('ERROR', `Erro ao buscar usuário admin: ${error.message}`)
              return {
                status: 500,
                body: JSON.stringify({
                  success: false,
                  requestId,
                  error: `Erro ao buscar usuário admin para author: ${error.message}`
                })
              }
            }
          }
        } else if (req.user) {
          // Para outras coleções, se tiver usuário logado e não tiver autor definido
          if ('author' in data && !data.author) {
            data.author = req.user.id
            log('DEBUG', `Definido autor para o usuário autenticado`, { userId: req.user.id })
          }
        }
      }

      // Adicionar data de criação/atualização
      const now = new Date().toISOString()
      
      if (operation === 'create' || operation === 'forcedCreate') {
        data.createdAt = data.createdAt || now
      }
      
      data.updatedAt = now

      let result
      let statusCode = 200
      let idField = 'id'
      
      // Verificar se temos um nome ou identificador para verificar existência
      const identifier = data.id || data.slug || data.name
      let existingDoc = null
      
      if (identifier && operation !== 'forcedCreate') {
        // Tentar encontrar o documento existente
        let where = {}
        
        if (data.id) {
          where = { id: { equals: data.id } }
          idField = 'id'
        } else if (data.slug) {
          where = { slug: { equals: data.slug } }
          idField = 'slug'
        } else if (data.name) {
          where = { name: { equals: data.name } }
          idField = 'name'
        }
        
        log('DEBUG', `Verificando existência de documento`, { type, idField, identifier, where })
        
        try {
          const existing = await req.payload.find({
            collection: type,
            where,
            limit: 1
          })
          
          if (existing.docs.length > 0) {
            existingDoc = existing.docs[0]
            log('INFO', `Documento existente encontrado`, { 
              type, 
              idField, 
              identifier, 
              docId: existingDoc.id
            })
          } else {
            log('DEBUG', `Documento não encontrado, será criado`, { type, idField, identifier })
          }
        } catch (findError) {
          log('ERROR', `Erro ao buscar documento existente: ${findError.message}`, { findError })
          // Continuamos com existingDoc como null
        }
      }
      
      // Determinar operação baseada na existência do documento
      if (existingDoc && operation !== 'forcedCreate') {
        if (operation === 'create' && options.overrideExisting === false) {
          // Um documento já existe e não devemos sobrescrevê-lo
          log('INFO', `Documento já existe e não será sobrescrito (overrideExisting=false)`, {
            type,
            docId: existingDoc.id
          })
          
          return {
            status: 200,
            body: JSON.stringify({
              success: true,
              requestId,
              operation: 'skipped',
              message: `Documento ${type} já existe e não foi modificado`,
              data: existingDoc
            })
          }
        } else {
          // Atualizar documento existente
          log('INFO', `Atualizando documento existente`, {
            type,
            docId: existingDoc.id
          })
          
          result = await req.payload.update({
            collection: type,
            id: existingDoc.id,
            data: data,
            depth: options.relationshipDepth || 1
          })
          
          statusCode = 200
          log('INFO', `Documento atualizado com sucesso`, {
            type,
            docId: result.id
          })
        }
      } else {
        // Criar novo documento
        log('INFO', `Criando novo documento`, { type })
        
        result = await req.payload.create({
          collection: type,
          data: data,
          depth: options.relationshipDepth || 1
        })
        
        statusCode = 201
        log('INFO', `Documento criado com sucesso`, {
          type,
          docId: result.id
        })
      }

      // Verificar se existem operações pós-importação específicas para cada tipo
      if (type === 'themes' && !options.skipValidation) {
        log('INFO', `Inicializando validação do tema`, { themeId: result.id })
        
        // Aqui será implementada a lógica para validação de temas
        // Por exemplo, enviar um evento para o sistema Astro processar
      }
      
      // Responder com sucesso
      const response = {
        success: true,
        requestId,
        operation: existingDoc && operation !== 'forcedCreate' ? 'update' : 'create',
        message: `Documento ${type} ${existingDoc && operation !== 'forcedCreate' ? 'atualizado' : 'criado'} com sucesso`,
        data: result
      }
      
      log('INFO', `Resposta enviada com sucesso`, {
        statusCode,
        operation: response.operation
      })
      
      return {
        status: statusCode,
        body: JSON.stringify(response)
      }
    } catch (error) {
      log('ERROR', `Erro ao processar importação: ${error.message}`, {
        stack: error.stack,
        code: error.code
      })
      
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          requestId,
          error: `Erro interno: ${error.message}`,
          code: error.code || 'INTERNAL_ERROR'
        })
      }
    }
  }
}

export default importDataEndpoint