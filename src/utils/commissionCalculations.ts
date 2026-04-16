// src/utils/commissionCalculations.ts
import type { Tour, Agency, CustomCommission } from '../types';

/** Retorna a comissão unitária (por pessoa OU por saída, conforme tipoPreco do tour). */
export function calcularComissaoUnitaria(
  tour: Tour,
  agencia: Agency | null,
  customCommissions: CustomCommission[]
): number {
  const agora = new Date();
  const promo = customCommissions.find(
    cc => cc.passeioId === tour.id && (!cc.dataFim || cc.dataFim.toDate() > agora)
  );
  if (promo) return promo.valor;
  if (agencia?.taxaComissaoPersonalizada != null)
    return (tour.precoBase * agencia.taxaComissaoPersonalizada) / 100;
  return tour.comissaoPadrao ?? 0;
}

/** Valor total da venda. */
export function calcularValorTotal(tour: Tour, quantidade: number, quantidadePessoas: number): number {
  return tour.tipoPreco === 'por_passeio'
    ? tour.precoBase * quantidade
    : tour.precoBase * quantidadePessoas * quantidade;
}

/** Comissão total da venda. */
export function calcularComissaoTotal(
  comissaoUnitaria: number, tour: Tour, quantidade: number, quantidadePessoas: number
): number {
  return tour.tipoPreco === 'por_passeio'
    ? comissaoUnitaria * quantidade
    : comissaoUnitaria * quantidadePessoas * quantidade;
}

export function calcularComissaoIndividual(comissaoTotal: number, numeroRecepcionistas: number = 4): number {
  return comissaoTotal / numeroRecepcionistas;
}

// Interface para tipar o objeto de agência no Map
interface AgenciaGroup {
  agencyId: string;
  agencyName: string;
  agencyPhone?: string;
  sales: any[];
  total: number;
}

// 🆕 NOVA FUNÇÃO: Calcula comissão pendente vs paga
export function calcularSaldos(vendas: any[]) {
  // 🔧 CORREÇÃO: Considera vendas sem paymentStatus como "pending"
  const pendentes = vendas.filter(v => {
    if (v.status !== 'confirmada') return false;
    // Se não tem paymentStatus ou é 'pending', considera pendente
    return !v.paymentStatus || v.paymentStatus === 'pending';
  });
  
  const pagas = vendas.filter(v => 
    v.status === 'confirmada' && v.paymentStatus === 'paid'
  );
  
  const totalPendente = pendentes.reduce((sum, v) => sum + (v.comissaoCalculada || 0), 0);
  const totalPago = pagas.reduce((sum, v) => sum + (v.comissaoCalculada || 0), 0);
  const totalGeral = totalPendente + totalPago;
  
  // Valor individual (dividido por 4)
  const pendenteIndividual = calcularComissaoIndividual(totalPendente);
  const pagoIndividual = calcularComissaoIndividual(totalPago);
  const totalIndividual = pendenteIndividual + pagoIndividual;
  
  return {
    totalPendente,
    totalPago,
    totalGeral,
    pendenteIndividual,
    pagoIndividual,
    totalIndividual,
    qtdPendentes: pendentes.length,
    qtdPagas: pagas.length
  };
}

// 🆕 Função para agrupar vendas pendentes por agência
export function agruparVendasPendentesPorAgencia(vendas: any[]): AgenciaGroup[] {
  const porAgencia = new Map();
  
  vendas.forEach((venda) => {
    // 🔧 CORREÇÃO: Verificação mais flexível
    const isConfirmada = venda.status === 'confirmada';
    const isPending = !venda.paymentStatus || venda.paymentStatus === 'pending';
    const hasAgencia = venda.agenciaId;
    
    if (!isConfirmada || !isPending || !hasAgencia) return;
    
    const key = venda.agenciaId;
    const existing = porAgencia.get(key) || {
      agencyId: venda.agenciaId,
      agencyName: venda.agenciaNome || 'Agência',
      agencyPhone: venda.agenciaTelefone,
      sales: [],
      total: 0
    };
    
    existing.sales.push(venda);
    existing.total += venda.comissaoCalculada || 0;
    porAgencia.set(key, existing);
  });
  
  return Array.from(porAgencia.values());
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: Date | any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function safeToDate(v: any): Date {
  if (!v) return new Date();
  if (typeof v === 'object' && 'toDate' in v) return v.toDate();
  return new Date(v);
}