import { PayloadRequest } from 'payload/types'

/**
 * Valida a chave de API nas requisições
 * 
 * Esta função verifica se a chave de API fornecida no cabeçalho ou 
 * nos parâmetros da requisição corresponde à chave de API interna configurada.
 * 
 * @param req Objeto de requisição do Express
 * @returns boolean Indica se a chave de API é válida
 */
export const validateAPIKey = (req: PayloadRequest): boolean => {
  // Obter a chave de API das variáveis de ambiente
  const internalApiKey = process.env.INTERNAL_API_KEY || 'dev_api_key'
  
  // Verificar se a chave de API foi fornecida no cabeçalho
  // O Express.js converte cabeçalhos para minúsculas, então precisamos verificar ambas as formas
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['api-key'] || req.headers['X-API-Key'] || req.headers['API-Key'] || req.get?.('X-API-Key')
  
  // Verificar se a chave de API foi fornecida no corpo ou query
  const apiKeyBody = req.body?.apiKey
  const apiKeyQuery = req.query?.apiKey
  
  // Verificar qualquer uma das fontes possíveis
  const providedApiKey = 
    (typeof apiKeyHeader === 'string' && apiKeyHeader) ||
    (typeof apiKeyBody === 'string' && apiKeyBody) ||
    (typeof apiKeyQuery === 'string' && apiKeyQuery)
  
  // Registrar tentativa de autenticação (sem mostrar a chave completa)
  const maskedKey = providedApiKey 
    ? `${providedApiKey.substring(0, 3)}...${providedApiKey.substring(providedApiKey.length - 3)}` 
    : 'não fornecida'
  
  console.log(`[Auth] Validando chave de API: ${maskedKey}`)
  console.log(`[Auth] Headers de autenticação:`, {
    'x-api-key': req.headers['x-api-key'],
    'X-API-Key': req.headers['X-API-Key'],
    allHeaders: req.headers,
  })
  
  // Comparar as chaves
  const isValid = providedApiKey === internalApiKey
  
  if (!isValid) {
    console.log(`[Auth] ⛔ Validação de chave de API falhou`)
  } else {
    console.log(`[Auth] ✅ Chave de API validada com sucesso`)
  }
  
  return isValid
}