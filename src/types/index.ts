// Tipo para um apartamento
export interface Apartment {
  occupied: boolean;
  pax: number;
  towels: number;
  chips: number;
  block: string;
  guest: string;
}

// Tipo para histórico
export interface LogEntry {
  id?: string;
  time: string;
  date: string;
  apt: number;
  msg: string;
  type: 'checkin' | 'checkout' | 'towel' | 'other';
  ts: number;
}

// Tipo para perdas
export interface LossEntry {
  id?: string;
  apt: number;
  block: string;
  guest: string;
  lost: number;
  date: string;
  ts: number;
}

// Tipo para recibos
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
}

// Tipo para documentos
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
}