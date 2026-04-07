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