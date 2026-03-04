import { GoogleGenerativeAI } from '@google/generative-ai';

interface Insight {
  tipo: 'alerta' | 'sucesso' | 'neutro';
  titulo: string;
  descricao: string;
  metricaDeApoio: string;
}

export interface AIInsightsResponse {
  insights: Insight[];
  modeloUsado: string;
  cotaDiaria: string;
}

export const generateInsights = async (
  teamName: string,
  month: string,
  ticketsData: any[],
  chamadosData: any[]
): Promise<AIInsightsResponse> => {

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }

  // Inicializando com o SDK oficial e a chave atualizada
  const genAI = new GoogleGenerativeAI(apiKey);

  const ticketsCount = ticketsData.length;
  // Grouping GLPI Data
  const categories: Record<string, number> = {};
  const origens: Record<string, number> = {};
  const requerentes: Record<string, number> = {};
  const tecnicos: Record<string, number> = {};

  ticketsData.forEach((t: any) => {
    const cat = t.categoria || 'Sem Categoria';
    categories[cat] = (categories[cat] || 0) + 1;

    const ori = t.origem || 'Sem Origem';
    origens[ori] = (origens[ori] || 0) + 1;

    const req = t.requerente || 'Desconhecido';
    requerentes[req] = (requerentes[req] || 0) + 1;

    const tec = t.tecnico || 'Sem Tecnico';
    tecnicos[tec] = (tecnicos[tec] || 0) + 1;
  });

  const getTop = (record: Record<string, number>, limit: number = 3) =>
    Object.entries(record).sort((a, b) => b[1] - a[1]).slice(0, limit);

  // Grouping JIRA Data
  const chamadosCount = chamadosData.length;
  const jiraStatus: Record<string, number> = {};
  const jiraModulos: Record<string, number> = {};
  const jiraProjetos: Record<string, number> = {};

  chamadosData.forEach((c: any) => {
    const status = c.statusChamado || 'Sem Status';
    jiraStatus[status] = (jiraStatus[status] || 0) + 1;

    const mod = c.modulo || 'Sem Modulo';
    jiraModulos[mod] = (jiraModulos[mod] || 0) + 1;

    const proj = c.projeto || 'Sem Projeto';
    jiraProjetos[proj] = (jiraProjetos[proj] || 0) + 1;
  });

  const prompt = `
Você é uma IA analista estratégica de TI. Analise os dados do time "${teamName}" do mês "${month}":

--- DADOS GLPI (Suporte / Operação) ---
Volume Total: ${ticketsCount} tickets
Top Categorias: ${JSON.stringify(getTop(categories, 5))}
Canais de Origem: ${JSON.stringify(getTop(origens))}
Quem mais pede suporte: ${JSON.stringify(getTop(requerentes))}
Técnicos mais atuantes: ${JSON.stringify(getTop(tecnicos))}

--- DADOS JIRA (Projetos / Sustentação) ---
Volume Total: ${chamadosCount} chamados
Projetos: ${JSON.stringify(getTop(jiraProjetos))}
Módulos mais afetados: ${JSON.stringify(getTop(jiraModulos))}
Distribuição de Status: ${JSON.stringify(jiraStatus)}

Gere 3 insights profundos de performance cruzando esses dados (ex: gargalos, sucessos, fardos operativos).
Tente equilibrar entre:
- 1 "sucesso" (algo positivo nos dados)
- 1 "alerta" (ponto crítico ou anomalia)
- 1 "neutro" (observação estratégica/padrão)

Retorne APENAS um JSON puro no texto:
{
  "insights": [
    { "tipo": "alerta" | "sucesso" | "neutro", "titulo": "Título", "descricao": "Explicação", "metricaDeApoio": "Dado X" }
  ]
}
REGRAS: 1- JSON puro. 2- Proibido mencionar SLA. 3- Linguagem PT-BR.
`;

  // Lista de modelos EXATAMENTE como reportado pela sua chave (sua conta está em canal de Preview Antecipado)
  const modelIds = [
    'gemini-3-flash-preview',  // O que você pediu! (Versão Preview)
    'gemini-2.5-flash',        // Versão Antecipada
    'gemini-2.0-flash',        // Versão Estável 2.0
    'gemini-flash-latest'      // Backup Estável
  ];

  console.log(`[AI] Gerando insights com sua chave de acesso antecipado (Preview).`);

  for (const modelId of modelIds) {
    try {
      console.log(`[AI] Tentando modelo: ${modelId}`);
      const model = genAI.getGenerativeModel({ model: modelId });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      if (!rawText) continue;

      const cleanJsonString = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJsonString);

      console.log(`[AI] SUCESSO com o modelo do canal Preview: ${modelId}`);
      return {
        insights: parsed.insights || [],
        modeloUsado: modelId,
        cotaDiaria: '15 análises/dia' // Limite base da conta free da API Google
      };
    } catch (error: any) {
      const msg = error.message || '';
      const status = error.status || 0;
      const isQuota = status === 429 || msg.includes('429');
      const isNotFound = status === 404 || msg.includes('404') || msg.includes('not found');

      console.warn(`[AI] Falha no ${modelId}: ${isQuota ? 'Sem Cota (429)' : isNotFound ? 'Não encontrado (404)' : msg}`);

      if (isQuota || isNotFound) continue;

      console.error(`[AI] Próximo modelo disponivel na sua conta...`);
    }
  }

  throw new Error('Todos os modelos do seu canal de Preview falharam ou atingiram o limite de quota. Tente novamente em alguns minutos.');
};
