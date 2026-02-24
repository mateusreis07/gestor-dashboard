export interface MonthlyCalls {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface CorporateData {
  calls2023: MonthlyCalls;
  calls2024: MonthlyCalls;
  calls2025: MonthlyCalls;
  calls2026: MonthlyCalls;
  projects: string[];
  trainings: { date: string; title: string }[];
}

const defaultData: CorporateData = {
  calls2023: {
    jan: 488, feb: 364, mar: 544, apr: 458,
    may: 1053, jun: 1407, jul: 1080, aug: 887,
    sep: 804, oct: 766, nov: 891, dec: 508
  },
  calls2024: {
    jan: 776, feb: 712, mar: 891, apr: 1162,
    may: 1022, jun: 909, jul: 990, aug: 913,
    sep: 1233, oct: 1483, nov: 1578, dec: 971
  },
  calls2025: {
    jan: 1409, feb: 1554, mar: 1204, apr: 1593,
    may: 1438, jun: 1434, jul: 1737, aug: 1773,
    sep: 1893, oct: 1948, nov: 1679, dec: 1537
  },
  calls2026: {
    jan: 1442, feb: 0, mar: 0, apr: 0,
    may: 0, jun: 0, jul: 0, aug: 0,
    sep: 0, oct: 0, nov: 0, dec: 0
  },
  projects: [
    "Fluxo de Contrarrazões",
    "Fluxo Camara da Saúde (CRDS)",
    "GSI",
    "Fluxo de arquivamento IPL, TCO e PIC",
    "Fluxo da CGMP (dois biênios)",
    "Fluxo GAECO (CI, CYBERGAECO, GEAC, GAEJURI)",
    "Fluxo de protocolo para Petição Inicial Extrajudicial",
    "Fluxo NUPEIA",
    "Fluxo assessores remotos",
    "Fluxo de Atuação Conjunta",
    "Processos complexos (Procuradorias)",
    "Manual de Retificação de Portaria (CSMP)",
    "Configuração dos Juizes das Garantias",
    "Dica do Dia (semanal)"
  ],
  trainings: [
    { date: "02/04", title: "Treinamento no Fluxo Corregedoria" },
    { date: "05/06", title: "Treinamento com o Setor de Protocolos" },
    { date: "31/07", title: "Treinamento com Novos Promotores" },
    { date: "07/08", title: "Workshop: Gerenciador de Arquivo" },
    { date: "11/08", title: "Treinamento para PJ de Muaná" },
    { date: "04/09", title: "Workshop: Criação de Modelo e Emissão de Documento" }
  ]
};

const STORAGE_KEY = 'gestor_corporate_data';

export const loadCorporateData = (): CorporateData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with default data to guarantee fields (e.g. if new years are added)
      return {
        ...defaultData,
        ...parsed,
        calls2023: { ...defaultData.calls2023, ...parsed.calls2023 },
        calls2024: { ...defaultData.calls2024, ...parsed.calls2024 },
        calls2025: { ...defaultData.calls2025, ...parsed.calls2025 },
        calls2026: { ...defaultData.calls2026, ...parsed.calls2026 },
      };
    }
  } catch (error) {
    console.error('Failed to parse corporate data', error);
  }
  return defaultData;
};

export const saveCorporateData = (data: CorporateData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save corporate data', error);
  }
};
