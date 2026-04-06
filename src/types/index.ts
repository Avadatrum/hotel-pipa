// Tipo para um apartamento
export interface Apartment {
  occupied: boolean;
  pax: number;
  towels: number;
  chips: number;
  block: string;
  guest: string;
  phone?: string; // NOVO: Telefone do hóspede (WhatsApp)
}

// Tipos para Autenticação
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
  createdAt: string;
  createdBy?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Tipo para histórico (Atualizado com auditoria)
export interface LogEntry {
  id?: string;
  time: string;
  date: string;
  apt: number;
  msg: string;
  type: 'checkin' | 'checkout' | 'towel' | 'other';
  ts: number;
  userId: string;
  userName: string;
}

// Tipo para perdas (Atualizado com auditoria)
export interface LossEntry {
  id?: string;
  apt: number;
  block: string;
  guest: string;
  lost: number;
  date: string;
  ts: number;
  userId: string;
  userName: string;
}

// Tipo para recibos (Atualizado com auditoria)
export interface Receipt {
  id?: string;

  // Campos do formulário
  ref: string;
  name: string;
  cpf: string;
  value: string;
  date: string;
  period: string;
  extra: string;

  // Metadados de criação
  num: string;
  createdAt: string;
  ts: number;
  userId: string;
  userName: string;

  // Metadados de edição (novos — opcionais)
  updatedAt?: string;
  updatedTs?: number;
  updatedBy?: string;
}

// Tipo para documentos (Atualizado com auditoria)
export interface Document {
  id?: string;
  name: string;
  desc: string;
  cat: string;
  mime: string;
  filename: string;
  data: string;
  createdAt: string;
  ts: number;
  userId: string;
  userName: string;
}

// ============ TIPOS PARA COMISSÕES (ATUALIZADOS) ============

export interface Tour {
  id: string;
  nome: string;
  precoBase: number;
  comissaoPadrao: number;
  unidade: string;
  tipo?: string;
  agenciaId?: string | null;
  ativo: boolean;
  createdAt?: any;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: any;
}

export interface Agency {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  taxaComissaoPersonalizada?: number | null;
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
}

export interface CustomCommission {
  id: string;
  passeioId: string;
  agenciaId?: string | null;
  valor: number;
  dataInicio: any;
  dataFim: any | null;
  createdAt?: any;
  createdBy?: string;
}

// Se você usa outros tipos, exporte também
export interface Sale {
  id: string;
  clienteNome: string;
  clienteTelefone?: string;
  passeioId: string;
  passeioNome: string;
  vendedorId: string;
  vendedorNome: string;
  dataVenda: any;
  dataPasseioRealizacao?: any;
  valorTotal: number;
  comissaoCalculada: number;
  status: 'confirmada' | 'cancelada';
  quantidade: number;
  agenciaId?: string;
  agenciaNome?: string;
  observacoes?: string;
}

// Mantido caso ainda seja utilizado em algum lugar do projeto
export interface CommissionAudit {
  id: string;
  passeioId?: string;
  agenciaId?: string;
  valorAntigo: number;
  valorNovo: number;
  alteradoPor: string;
  alteradoPorNome: string;
  dataAlteracao: any;
}

export interface AppSettings {
  comissaoPadraoGlobal: number;
}