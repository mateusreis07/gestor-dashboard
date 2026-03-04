import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function testSingle(m: string) {
  try {
    const model = genAI.getGenerativeModel({ model: m });
    const result = await model.generateContent("hi");
    const response = await result.response;
    if (response.text()) {
      console.log(` ✅ [SUCCESS] ${m}`);
    }
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('429')) console.log(` ⚠️ [QUOTA] ${m} (existe mas sem cota)`);
    else if (msg.includes('404') || msg.includes('not found')) console.log(` ❌ [NOT_FOUND] ${m}`);
    else console.log(` ❓ [ERROR] ${m}: ${e.message}`);
  }
}

async function run() {
  console.log('--- Testando modelos com PREFIXO ---');
  await testSingle('models/gemini-1.5-flash');
  await testSingle('models/gemini-1.5-pro');
  await testSingle('models/gemini-1.5-flash-8b');
  // Versão experimental que costuma ter cota livre
  await testSingle('models/gemini-2.0-flash-exp');
}
run();
