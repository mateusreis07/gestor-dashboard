export interface Ticket {
  ID: string;
  Título: string;
  Status: string;
  "Data de abertura": string;
  "Última atualização": string;
  "Requerente - Requerente": string; // Requester
  "Atribuído - Técnico": string; // Assigned Technician
  Categoria: string;
  Localização: string;
  "Origem da requisição": string; // Origin of Request
}

export interface OriginData {
  name: string;
  value: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface RequesterData {
  name: string;
  value: number;
}

export interface HistoryData {
  name: string; // e.g., "Jan", "Fev"
  fullLabel: string; // e.g., "Janeiro 2024"
  value: number;
  order: number; // for sorting
}

export interface Team {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional because we might not want to expose it in all contexts, but for now we store it.
  createdAt: number;
}

export interface Manager {
  name: string;
  email: string;
  password: string;
}

// --- XLSX Chamados (new spreadsheet) ---

export interface Chamado {
  numeroChamado: string;
  resumo: string;
  criado: string;
  fimDoPrazo: string;
  prazoAjustado: string;
  statusChamado: string;
  relator: string;
  modulo: string;
  funcionalidade: string;
}

export interface StatusData {
  name: string;
  value: number;
  color: string;
}

export interface FuncionalidadeData {
  name: string;
  value: number;
}
