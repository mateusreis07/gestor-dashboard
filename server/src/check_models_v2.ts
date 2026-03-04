import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || '';
console.log('Chave:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

async function checkModel(modelId: string) {
  try {
    console.log(`\n--- Testando ${modelId} ---`);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent('Diga "OK"');
    const response = await result.response;
    console.log(`Resposta: ${response.text()}`);
  } catch (error: any) {
    console.log(`Status: ${error.status}`);
    console.log(`Mensagem: ${error.message}`);
    if (error.response) {
      // Dump full error body if possible
    }
  }
}

async function run() {
  // Test both with and without prefix for 1.5 and 2.0
  await checkModel('gemini-1.5-flash');
  await checkModel('models/gemini-1.5-flash');
  await checkModel('gemini-2.0-flash');
  await checkModel('models/gemini-2.0-flash');
}

run();
