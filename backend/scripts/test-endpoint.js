// Simulação de requisição para o endpoint import-data

console.log('Iniciando teste de endpoint import-data');

async function testImportDataEndpoint() {
  try {
    const testData = {
      type: "themes",
      operation: "create",
      data: {
        name: "Tema de Teste Completo",
        description: "Um tema para teste do endpoint",
        version: "1.0.0",
        status: "draft",
        author: null,
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
      },
      options: {
        skipValidation: true,
        overrideExisting: true
      }
    };

    console.log('Enviando dados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/import-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dev_api_key'
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log('Status da resposta:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    console.log('Texto da resposta:', responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('JSON da resposta:', JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.error('Erro ao processar JSON da resposta:', e);
    }
  } catch (error) {
    console.error('Erro ao executar teste:', error);
  }
}

testImportDataEndpoint();