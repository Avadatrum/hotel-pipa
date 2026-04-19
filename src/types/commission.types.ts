// src/types/commission.types.ts

export type TipoPreco = 'por_pessoa' | 'por_passeio';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'pix' | 'transfer' | 'other';

export interface Tour {
  id: string;
  nome: string;
  descricao?: string;
  precoBase: number;
  comissaoPadrao: number;
  unidade: string;
  tipo?: string;
  tipoPreco: TipoPreco;
  capacidadeMaxima?: number;
  agenciaId?: string | null;
  ativo: boolean;
  fotos?: string[]; // 🆕 URLs das fotos no Storage
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
  quantidadePessoas: number;
  tipoPreco: TipoPreco;
  precoUnitarioVendido: number;
  agenciaId?: string | null;
  agenciaNome?: string | null;
  observacoes?: string;
  
  // 🆕 CAMPOS DE PAGAMENTO
  paymentStatus: PaymentStatus;
  paidAt?: any;
  paidBy?: string;
  paidByName?: string;
  paymentMethod?: PaymentMethod;
  paymentObservations?: string;
  
  // 🆕 CAMPOS DE ARQUIVAMENTO E PERÍODO
  periodoComissao?: string; // Formato: "2024-01"
  arquivado?: boolean;
  dataArquivamento?: any;
  arquivadoPor?: string; // 🆕
  arquivadoPorNome?: string; // 🆕
  
  createdAt?: any;
  updatedAt?: any;
}

// 🆕 NOVO TIPO PARA PAGAMENTOS EM LOTE
export interface CommissionPayment {
  id: string;
  saleIds: string[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paidAt: any;
  paidBy: string;
  paidByName: string;
  observations?: string;
  createdAt?: any;
}

// 🆕 TIPO PARA RELATÓRIO DE AGÊNCIA
export interface AgencyCommissionReport {
  agencyId: string;
  agencyName: string;
  agencyPhone?: string;
  pendingSales: Sale[];
  totalPending: number;
  periodStart: Date;
  periodEnd: Date;
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
  numeroRecepcionistas?: number; // 🆕 Padrão 4
}