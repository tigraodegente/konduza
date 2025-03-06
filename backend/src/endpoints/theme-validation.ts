import { Endpoint } from 'payload/config'
import { validateAPIKey } from '../utils/validateAPIKey'

/**
 * Endpoint para validação de temas
 * 
 * Este endpoint é chamado pelo Astro para validar um tema e atualizar seu status.
 * Requer a chave de API interna para autenticação.
 */
const themeValidationEndpoint: Endpoint = {
  path: '/api/theme-validation',
  method: 'post',
  handler: async (req) => {
    try {
      console.log(`[ThemeValidation] Requisição recebida para validação de tema`)
      
      // Validar chave de API
      if (!validateAPIKey(req)) {
        console.log(`[ThemeValidation] ⛔ Erro de autenticação: Chave de API inválida`)
        return {
          status: 401,
          body: JSON.stringify({
            success: false,
            error: 'Não autorizado - Chave de API inválida',
          })
        }
      }

      const { themeId, validationStatus, validationData } = req.body || {}

      // Validar parâmetros obrigatórios
      if (!themeId || !validationStatus) {
        console.log(`[ThemeValidation] ⚠️ Parâmetros inválidos: themeId=${themeId}, validationStatus=${validationStatus}`)
        return {
          status: 400,
          body: JSON.stringify({
            success: false,
            error: 'Parâmetros inválidos - themeId e validationStatus são obrigatórios',
          })
        }
      }

      console.log(`[ThemeValidation] Validando tema ID=${themeId} com status=${validationStatus}`)

      // Verificar se o tema existe
      const theme = await req.payload.findByID({
        collection: 'themes',
        id: themeId,
      })

      if (!theme) {
        console.log(`[ThemeValidation] ❌ Tema com ID ${themeId} não encontrado`)
        return {
          status: 404,
          body: JSON.stringify({
            success: false,
            error: `Tema com ID ${themeId} não encontrado`,
          })
        }
      }

      console.log(`[ThemeValidation] Tema encontrado: ${theme.name}`)

      // Atualizar o tema com os resultados da validação
      await req.payload.update({
        collection: 'themes',
        id: themeId,
        data: {
          validationStatus,
          validationResults: validationData || null,
        },
        user: req.user || null,
        overrideAccess: true,
      })

      console.log(`[ThemeValidation] ✅ Tema ${themeId} (${theme.name}) atualizado com status: ${validationStatus}`)

      // Responder com sucesso
      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          message: `Tema ${themeId} atualizado com status: ${validationStatus}`,
        })
      }
    } catch (error) {
      console.error(`[ThemeValidation] ❌ Erro ao processar validação: ${error.message}`)
      console.error(error.stack)
      return {
        status: 500,
        body: JSON.stringify({
          success: false,
          error: `Erro interno: ${error.message}`,
        })
      }
    }
  },
}

export default themeValidationEndpoint