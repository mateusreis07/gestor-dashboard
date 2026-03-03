import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Insight {
  tipo: 'alerta' | 'sucesso' | 'neutro';
  titulo: string;
  descricao: string;
  metricaDeApoio: string;
}

export const generateInsights = async (
  teamName: string,
  month: string,
  ticketsData: any[],
  chamadosData: any[]
): Promise<Insight[]> => {

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }

  const ticketsCount = ticketsData.length;
  const chamadosCount = chamadosData.length;

  // Agrupar tickets por categoria
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

    const tec = t.tecnico || 'Sem Técnico';
    tecnicos[tec] = (tecnicos[tec] || 0) + 1;
  });

  const topCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topOrigens = Object.entries(origens).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topRequerentes = Object.entries(requerentes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topTecnicos = Object.entries(tecnicos).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Agrupar chamados (Jira) por status e funcionalidade
  const jiraStatus: Record<string, number> = {};
  const jiraFuncionalidades: Record<string, number> = {};
  const jiraModulos: Record<string, number> = {};

  chamadosData.forEach((c: any) => {
    const status = c.statusChamado || 'Sem Status';
    jiraStatus[status] = (jiraStatus[status] || 0) + 1;

    const func = c.funcionalidade || 'Sem Funcionalidade';
    jiraFuncionalidades[func] = (jiraFuncionalidades[func] || 0) + 1;

    const mod = c.modulo || 'Sem Módulo';
    jiraModulos[mod] = (jiraModulos[mod] || 0) + 1;
  });

  const prompt = `
Você é um Consultor de Operações e Performance de TI Sênior, analisando dados reais do time "${teamName}" referente ao mês "${month}".

DADOS DO MÊS — GLPI (Tickets):
- Volume total: ${ticketsCount}
- Top Categorias: ${JSON.stringify(topCategories)}
- Origens: ${JSON.stringify(topOrigens)}
- Top Requerentes (quem mais abriu): ${JSON.stringify(topRequerentes)}
- Top Técnicos (quem mais atendeu): ${JSON.stringify(topTecnicos)}

DADOS DO MÊS — JIRA (Chamados):
- Volume total: ${chamadosCount}
- Distribuição de Status: ${JSON.stringify(jiraStatus)}
- Top Funcionalidades afetadas: ${JSON.stringify(Object.entries(jiraFuncionalidades).sort((a, b) => b[1] - a[1]).slice(0, 5))}
- Top Módulos: ${JSON.stringify(Object.entries(jiraModulos).sort((a, b) => b[1] - a[1]).slice(0, 5))}

REGRAS OBRIGATÓRIAS:
1. Retorne EXATAMENTE um JSON válido seguindo a estrutura abaixo. NENHUM texto fora do JSON.
2. Não mencione "SLA" em nenhuma hipótese. Não trabalhamos com SLA.
3. Foque em: anomalias, concentração de volume, produtividade de técnicos/requerentes, gargalos por funcionalidade/módulo.
4. Gere entre 3 e 5 insights incisivos e acionáveis.
5. Seja direto, profissional e em Português Brasileiro.
6. Cada tipo deve ser exatamente: "alerta", "sucesso" ou "neutro".

FORMATO JSON DE SAÍDA:
{
  "insights": [
    {
      "tipo": "alerta" | "sucesso" | "neutro",
      "titulo": "Frase curta de 3 a 6 palavras",
      "descricao": "Explicação do dado com sugestão de ação concreta.",
      "metricaDeApoio": "ex: 45 tickets, +12%, Top 1"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    const rawText = response.text ?? '';
    if (!rawText) throw new Error('Resposta vazia do Gemini');

    // Limpar possíveis markdown wrappers
    const cleanJsonString = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanJsonString);
    return parsed.insights || [];
  } catch (error) {
    console.error('Erro no aiService (Gemini):', error);
    throw new Error('Falha ao gerar insights com IA.');
  }
};
