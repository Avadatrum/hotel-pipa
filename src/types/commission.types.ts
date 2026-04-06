// src/types/commission.types.ts

export type TipoPreco = 'por_pessoa' | 'por_passeio';

export interface Tour {
  id: string;
  nome: string;
  precoBase: number;
  comissaoPadrao: number; // Valor fixo em R$ (por pessoa ou por passeio, conforme tipoPreco)
  unidade: string;
  tipo?: string;
  tipoPreco: TipoPreco;       // Obrigatório agora
  capacidadeMaxima?: number;  // Apenas para tipoPreco === 'por_passeio'
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
  taxaComissaoPersonalizada?: number | null; // Percentual (%) aplicado sobre valorTotal
  createdAt?: any;
  createdBy?: string;
  updatedAt?: any;
}

export interface CustomCommission {
  id: string;
  passeioId: string;
  agenciaId?: string | null;
  valor: number; // Valor fixo em R$ que substitui comissaoPadrao do tour
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
  quantidade: number;         // Quantidade de passeios/veículos
  quantidadePessoas: number;  // Quantidade de pessoas (sempre presente)
  tipoPreco: TipoPreco;       // Salvo na venda para histórico
  precoUnitarioVendido: number; // Preço base no momento da venda
  agenciaId?: string | null;
  agenciaNome?: string | null;
  observacoes?: string;
  createdAt?: any;
  updatedAt?: any;
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