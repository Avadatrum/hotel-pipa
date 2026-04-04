import { Timestamp } from 'firebase/firestore';
// src/types/index.ts

// Tipo para um apartamento
export interface Apartment {
  occupied: boolean;
  pax: number;
  towels: number;
  chips: number;
  block: string;
  guest: string;
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
  ref: string;
  name: string;
  cpf: string;
  value: string;
  date: string;
  period?: string;
  extra?: string;
  num: string;
  createdAt: string;
  ts: number;
  userId: string;
  userName: string;
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

// ============ TIPOS PARA COMISSÕES ============

export interface Tour {
  id: string;
  nome: string;
  precoBase: number;
  unidade: 'pessoa' | 'quadriciclo' | 'lancha' | 'cavalo' | 'carro' | 'buggy' | 'helicóptero';
  tipo: string;
  comissaoPadrao: number;
  agenciaId: string | null;
  ativo: boolean;
  createdAt: any;
  createdBy: string;
}

export interface Agency {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email: string;
  taxaComissaoPersonalizada: number | null;
  createdAt: any;
  createdBy: string;
}

export interface Sale {
  id: string;
  dataVenda: Timestamp;
  dataPasseioRealizacao: string; // NOVO CAMPO - formato "YYYY-MM-DD HH:MM"
  passeioId: string;
  passeioNome: string;
  quantidade: number;
  precoUnitarioVendido: number;
  valorTotal: number;
  comissaoCalculada: number;
  vendedorId: string;
  vendedorNome: string;
  clienteNome: string;
  clienteTelefone?: string;
  observacoes?: string;
  status: 'confirmada' | 'cancelada';
  createdAt: Timestamp;
  canceledAt?: Timestamp | null;
  canceledBy?: string | null;
}

export interface CustomCommission {
  id: string;
  passeioId: string | null;
  agenciaId: string | null;
  tipoComissao: 'percentual' | 'fixo';
  valor: number;
  dataInicio: any;
  dataFim: any | null;
  createdAt: any;
  createdBy: string;
}

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