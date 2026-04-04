// src/types/commission.types.ts
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