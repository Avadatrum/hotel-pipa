// src/utils/commissionCalculations.ts
import type { Tour, Agency, CustomCommission } from '../types';

/**
 * Calcula a comissão unitária (por unidade: por passeio ou por pessoa).
 *
 * Hierarquia:
 *  1. Comissão personalizada ativa para o passeio (valor fixo R$)
 *  2. Taxa percentual da agência sobre o precoBase do tour
 *  3. comissaoPadrao do tour (valor fixo R$ — não percentual)
 *
 * NOTA: comissaoPadrao é sempre um valor fixo em R$, nunca percentual.
 * A função retorna o valor UNITÁRIO. Quem chama é responsável por
 * multiplicar por quantidade/quantidadePessoas conforme tipoPreco.
 */
export function calcularComissaoUnitaria(
  tour: Tour,
  agencia: Agency | null,
  customCommissions: CustomCommission[]
): number {
  // 1. Comissão personalizada ativa para o passeio
  const agora = new Date();
  const promo = customCommissions.find(cc =>
    cc.passeioId === tour.id &&
    (!cc.dataFim || cc.dataFim.toDate() > agora)
  );
  if (promo) return promo.valor;

  // 2. Taxa percentual da agência (sobre precoBase do tour)
  if (agencia?.taxaComissaoPersonalizada != null) {
    return (tour.precoBase * agencia.taxaComissaoPersonalizada) / 100;
  }

  // 3. Comissão padrão do tour (valor fixo R$)
  return tour.comissaoPadrao ?? 0;
}

/**
 * Calcula o valor total da venda.
 */
export function calcularValorTotal(
  tour: Tour,
  quantidade: number,
  quantidadePessoas: number
): number {
  if (tour.tipoPreco === 'por_passeio') {
    return tour.precoBase * quantidade;
  }
  return tour.precoBase * quantidadePessoas * quantidade;
}

/**
 * Calcula a comissão total da venda.
 */
export function calcularComissaoTotal(
  comissaoUnitaria: number,
  tour: Tour,
  quantidade: number,
  quantidadePessoas: number
): number {
  if (tour.tipoPreco === 'por_passeio') {
    return comissaoUnitaria * quantidade;
  }
  return comissaoUnitaria * quantidadePessoas * quantidade;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date | any): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return new Intl.DateTimeFormat('pt-BR').format(d);
}