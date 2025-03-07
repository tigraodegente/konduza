/**
 * Endpoint para validação de temas a partir do JSON
 * 
 * Valida um tema diretamente do JSON, sem importá-lo
 * Utilize o schema JSON para validação estruturada
 */

import { validateThemeJSON } from '../../utils/themeSchemaValidator.js';

export const prerender = false;

// Rota para obter o schema JSON
export async function GET({ request, url }) {
  const pathname = url.pathname;
  
  // Se for uma requisição para o schema
  if (pathname.endsWith('/schema')) {
    return new Response(
      JSON.stringify(getThemeSchema()),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Qualquer outra requisição GET não é suportada
  return new Response(
    JSON.stringify({ error: 'Método não suportado' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Validação do tema
export async function POST({ request }) {
  console.log('[ValidateThemeJSON API] Recebendo requisição de validação direta');
  
  try {
    // Processar requisição
    const data = await request.json();
    
    if (!data) {
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ['JSON inválido ou vazio']
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extrair dados do tema
    const themeData = data.data || data;
    
    // Realizar validação completa
    const validationResult = await validateThemeJSON(themeData);
    
    console.log(`[ValidateThemeJSON API] Resultado da validação: ${validationResult.valid ? 'Válido ✅' : 'Inválido ❌'}`);
    
    // Retornar resultado da validação
    return new Response(
      JSON.stringify(validationResult),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ValidateThemeJSON API] Erro:', error);
    
    return new Response(
      JSON.stringify({
        valid: false,
        errors: [`Erro na validação: ${error.message}`]
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Retorna o schema do tema
 */
function getThemeSchema() {
  return {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Tema Konduza",
    "description": "Schema para validação de temas no Konduza",
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["themes"],
        "description": "Tipo do objeto (deve ser 'themes')"
      },
      "operation": {
        "type": "string",
        "enum": ["create", "update"],
        "description": "Operação a ser realizada"
      },
      "data": {
        "type": "object",
        "required": ["name", "version", "layouts", "components"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Nome do tema"
          },
          "description": {
            "type": "string",
            "description": "Descrição do tema"
          },
          "version": {
            "type": "string",
            "pattern": "^\\d+\\.\\d+\\.\\d+$",
            "description": "Versão do tema (formato semver)"
          },
          "status": {
            "type": "string",
            "enum": ["draft", "review", "published"],
            "description": "Status do tema"
          },
          "validationStatus": {
            "type": "string",
            "enum": ["pending", "valid", "invalid"],
            "description": "Status de validação do tema"
          },
          "isSystem": {
            "type": "boolean",
            "description": "Indica se é um tema do sistema"
          },
          "templates": {
            "type": "array",
            "description": "Templates disponíveis no tema",
            "items": {
              "type": "object",
              "required": ["name", "key"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Nome do template"
                },
                "key": {
                  "type": "string",
                  "description": "Chave única do template"
                },
                "description": {
                  "type": "string",
                  "description": "Descrição do template"
                },
                "defaultTemplate": {
                  "type": "boolean",
                  "description": "Indica se é o template padrão"
                }
              }
            }
          },
          "mainStyles": {
            "type": "string",
            "description": "Estilos CSS principais do tema"
          },
          "layouts": {
            "type": "array",
            "description": "Layouts disponíveis no tema",
            "items": {
              "type": "object",
              "required": ["name", "key", "template"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Nome do layout"
                },
                "key": {
                  "type": "string",
                  "description": "Chave única do layout"
                },
                "isDefault": {
                  "type": "boolean",
                  "description": "Indica se é o layout padrão"
                },
                "template": {
                  "type": "string",
                  "description": "Código do template Astro"
                }
              }
            }
          },
          "components": {
            "type": "array",
            "description": "Componentes disponíveis no tema",
            "items": {
              "type": "object",
              "required": ["name", "key", "template"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Nome do componente"
                },
                "key": {
                  "type": "string",
                  "description": "Chave única do componente"
                },
                "description": {
                  "type": "string",
                  "description": "Descrição do componente"
                },
                "category": {
                  "type": "string",
                  "description": "Categoria do componente"
                },
                "template": {
                  "type": "string",
                  "description": "Código do template Astro"
                },
                "styles": {
                  "type": "string",
                  "description": "Estilos CSS do componente"
                },
                "schema": {
                  "type": "object",
                  "description": "Schema para configuração do componente"
                }
              }
            }
          },
          "globalScripts": {
            "type": "string",
            "description": "Scripts globais do tema"
          },
          "settings": {
            "type": "object",
            "description": "Configurações do tema",
            "properties": {
              "colors": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "key", "value"],
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": "Nome da cor"
                    },
                    "key": {
                      "type": "string",
                      "description": "Chave da cor para CSS (--color-{key})"
                    },
                    "value": {
                      "type": "string",
                      "description": "Valor da cor (hex, rgb, etc)"
                    }
                  }
                }
              },
              "fonts": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "key", "family"],
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": "Nome da fonte"
                    },
                    "key": {
                      "type": "string",
                      "description": "Chave da fonte para CSS (--font-{key})"
                    },
                    "family": {
                      "type": "string",
                      "description": "Família de fontes"
                    },
                    "url": {
                      "type": "string",
                      "description": "URL para importação da fonte"
                    }
                  }
                }
              },
              "spacing": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "key", "value"],
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": "Nome do espaçamento"
                    },
                    "key": {
                      "type": "string",
                      "description": "Chave do espaçamento para CSS (--spacing-{key})"
                    },
                    "value": {
                      "type": "string",
                      "description": "Valor do espaçamento (rem, px, etc)"
                    }
                  }
                }
              }
            }
          },
          "dependencies": {
            "type": "array",
            "description": "Dependências externas do tema",
            "items": {
              "type": "object",
              "required": ["name", "version", "type", "url"],
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Nome da dependência"
                },
                "version": {
                  "type": "string",
                  "description": "Versão da dependência"
                },
                "type": {
                  "type": "string",
                  "enum": ["css", "js"],
                  "description": "Tipo da dependência"
                },
                "url": {
                  "type": "string",
                  "description": "URL da dependência"
                }
              }
            }
          }
        }
      },
      "options": {
        "type": "object",
        "properties": {
          "skipValidation": {
            "type": "boolean",
            "description": "Pular a validação do tema"
          },
          "overrideExisting": {
            "type": "boolean",
            "description": "Sobrescrever tema existente com o mesmo nome"
          }
        }
      }
    },
    "required": ["type", "data"]
  };
}