import { PayloadRequest } from 'payload/types'
import { Response, NextFunction } from 'express'

/**
 * Middleware para registrar todas as requisições HTTP no Payload CMS
 */
export const logRequests = (req: PayloadRequest, res: Response, next: NextFunction) => {
  const start = Date.now()
  const { method, url, body, query } = req
  const userEmail = req.user?.email || 'anonymous'

  // Não logar requisições de assets para não poluir os logs
  if (url.startsWith('/media') || url.includes('favicon.ico')) {
    return next()
  }

  console.log(`[HTTP] ${method} ${url} - Iniciado por ${userEmail}`)
  
  // Logar parâmetros importantes (mas evitar logar senhas)
  if (Object.keys(query).length > 0) {
    const safeQuery = { ...query }
    if (safeQuery.password) safeQuery.password = '[REDACTED]'
    console.log(`[HTTP] Query: ${JSON.stringify(safeQuery)}`)
  }
  
  if (body && Object.keys(body).length > 0 && method !== 'GET') {
    const safeBody = { ...body }
    if (safeBody.password) safeBody.password = '[REDACTED]'
    if (safeBody.passwordConfirm) safeBody.passwordConfirm = '[REDACTED]'
    
    // Evitar logar conteúdo grande demais
    if (JSON.stringify(safeBody).length > 1000) {
      console.log(`[HTTP] Body: (conteúdo grande demais para log)`)
    } else {
      console.log(`[HTTP] Body: ${JSON.stringify(safeBody)}`)
    }
  }

  // Adicionar listener para quando a requisição terminar
  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusCategory = Math.floor(status / 100)
    
    let logLevel = 'INFO'
    if (statusCategory === 4) logLevel = 'WARN'
    if (statusCategory === 5) logLevel = 'ERROR'
    
    console.log(`[HTTP][${logLevel}] ${method} ${url} ${status} - ${duration}ms`)
    
    // Logar erros de forma mais detalhada
    if (statusCategory >= 4) {
      console.log(`[HTTP][ERROR] Detalhes: Usuário=${userEmail}, Status=${status}, Duração=${duration}ms, URL=${req.originalUrl || url}`)
    }
  })

  next()
}