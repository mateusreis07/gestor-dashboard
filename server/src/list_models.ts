import 'dotenv/config';

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log(`Buscando modelos para a chave: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log('Erro na API:', data.error.message);
      return;
    }

    if (data.models) {
      console.log('--- Modelos permitidos para esta chave ---');
      data.models.forEach((m: any) => {
        console.log(`ID: ${m.name} | Métodos: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log('Nenhum modelo retornado. A chave pode estar sem permissões ou restrita.');
    }
  } catch (error: any) {
    console.log('Erro na requisição:', error.message);
  }
}

listAllModels();
