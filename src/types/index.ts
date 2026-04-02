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