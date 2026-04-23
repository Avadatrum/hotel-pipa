// src/types/index.ts

export interface Apartment {
  occupied: boolean; pax: number; towels: number; chips: number;
  block: string; guest: string; phone?: string;
}

export interface User {
  id: string; name: string; email: string;
  role: 'admin' | 'operator'; createdAt: string; createdBy?: string;
}

export interface UserCredentials { email: string; password: string; }

export interface AuthState { user: User | null; loading: boolean; error: string | null; }

export interface LogEntry {
  id?: string; time: string; date: string; apt: number; msg: string;
  type: 'checkin' | 'checkout' | 'towel' | 'other'; ts: number; userId: string; userName: string;
}

export interface LossEntry {
  id?: string; apt: number; block: string; guest: string;
  lost: number; date: string; ts: number; userId: string; userName: string;
}

export interface Receipt {
  id?: string; ref: string; name: string; cpf: string; value: string; date: string;
  period: string; extra: string; num: string; createdAt: string; ts: number;
  userId: string; userName: string; updatedAt?: string; updatedTs?: number; updatedBy?: string;
}

export interface Document {
  id?: string; name: string; desc: string; cat: string; mime: string;
  filename: string; data: string; createdAt: string; ts: number; userId: string; userName: string;
}

// Re-exporta tipos de comissão
export type { 
  TipoPreco, 
  Tour, 
  Agency, 
  CustomCommission, 
  Sale, 
  CommissionAudit, 
  AppSettings,
  PaymentStatus,      // 🆕
  PaymentMethod,      // 🆕
  CommissionPayment,  // 🆕
  AgencyCommissionReport // 🆕
} from './commission.types';

// 🆕 Adicione esta linha
export * from './lostAndFound.types';

export interface TowelSignature {
  id?: string;
  aptNumber: number;
  guestName: string;
  token: string;
  operation: 'chips_to_towels' | 'towel_exchange';
  quantity: number;
  signature: string; // base64 da assinatura
  signedAt: string; // ISO date
  expiresAt: string; // token expira em 15 minutos
  used: boolean;
  wasCleared?: boolean; // NOVO: indica se a assinatura foi limpa no checkout
  clearedAt?: string; // NOVO: quando foi limpa
}