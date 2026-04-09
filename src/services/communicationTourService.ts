// src/services/communicationTourService.ts
import { formatCurrency, formatDate } from '../utils/commissionCalculations';
import type { Sale, Agency, Tour } from '../types/commission.types';

export interface SaleWithDetails extends Sale {
  tourData?: Tour;
  agencyData?: Agency;
}

function parseDataPasseio(dateString: any): { dateObj: Date; timeString: string } {
  if (!dateString) return { dateObj: new Date(), timeString: '' };
  if (typeof dateString === 'string' && dateString.includes(' ')) {
    const [datePart, timePart] = dateString.split(' ');
    return { dateObj: new Date(`${datePart}T${timePart}`), timeString: timePart };
  }
  const dateObj = new Date(dateString);
  return { dateObj, timeString: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
}

function descricaoQuantidade(sale: SaleWithDetails): string {
  const tipo = sale.tipoPreco ?? sale.tourData?.tipoPreco ?? 'por_pessoa';
  const qtdSaidas = sale.quantidade || 1;
  const qtdPessoas = sale.quantidadePessoas || 1;
  const cap = sale.tourData?.capacidadeMaxima;
  if (tipo === 'por_passeio') {
    const partes = [`${qtdPessoas} pessoa(s)`];
    if (qtdSaidas > 1) partes.unshift(`${qtdSaidas} veículo(s)`);
    if (cap) partes.push(`cap. máx: ${cap}`);
    return partes.join(' — ');
  }
  return qtdSaidas > 1
    ? `${qtdPessoas} pessoa(s) x ${qtdSaidas} saída(s)`
    : `${qtdPessoas} pessoa(s)`;
}

function descricaoPreco(sale: SaleWithDetails): string {
  const tipo = sale.tipoPreco ?? sale.tourData?.tipoPreco ?? 'por_pessoa';
  const preco = sale.precoUnitarioVendido ?? sale.tourData?.precoBase ?? 0;
  const qtdSaidas = sale.quantidade || 1;
  const qtdPessoas = sale.quantidadePessoas || 1;
  if (tipo === 'por_passeio') {
    const label = qtdSaidas > 1
      ? `${formatCurrency(preco)} x ${qtdSaidas} veículo(s)`
      : `${formatCurrency(preco)} por veículo`;
    return `${label} = *${formatCurrency(sale.valorTotal)}*`;
  }
  const label = qtdSaidas > 1
    ? `${formatCurrency(preco)} x ${qtdPessoas} pessoa(s) x ${qtdSaidas} saída(s)`
    : `${formatCurrency(preco)} x ${qtdPessoas} pessoa(s)`;
  return `${label} = *${formatCurrency(sale.valorTotal)}*`;
}

export const communicationTourService = {
  /** Relatório completo para agência (inclui comissão). */
  generateAgencyReport(sale: SaleWithDetails): string {
    const { dateObj, timeString } = parseDataPasseio(sale.dataPasseioRealizacao);
    const horario = timeString ? ` às ${timeString}` : '';
    return `*RELATÓRIO DE PASSEIO — HOTEL PIPA*

*Passeio:* ${sale.passeioNome}
*Cliente:* ${sale.clienteNome}${sale.clienteTelefone ? `\n*Telefone:* ${sale.clienteTelefone}` : ''}
*Data:* ${formatDate(dateObj)}${horario}
*Participantes:* ${descricaoQuantidade(sale)}
*Valor:* ${descricaoPreco(sale)}
*Comissão:* ${formatCurrency(sale.comissaoCalculada)}
 ${sale.observacoes ? `\n*Obs:* ${sale.observacoes}` : ''}
---
Hotel Pipa — ${new Date().toLocaleString('pt-BR')}`.trim();
  },

  /** Confirmação limpa para o hóspede (sem dados de comissão). */
  generateGuestConfirmation(sale: SaleWithDetails): string {
    const { dateObj, timeString } = parseDataPasseio(sale.dataPasseioRealizacao);
    const horario = timeString ? ` às ${timeString}` : '';
    const qtdPessoas = sale.quantidadePessoas || 1;
    return `*CONFIRMAÇÃO DE PASSEIO — HOTEL PIPA*

Olá, ${sale.clienteNome}! Seu passeio foi confirmado.

*Passeio:* ${sale.passeioNome}
*Data:* ${formatDate(dateObj)}${horario}
*Participantes:* ${qtdPessoas} pessoa(s)
*Valor:* ${formatCurrency(sale.valorTotal)}

O que levar: protetor solar, repelente, roupa de banho, toalha e dinheiro para extras.
Favor estar no lobby 15 minutos antes.

Dúvidas? Entre em contato.
*Hotel Pipa*`.trim();
  },

  /** Texto de divulgação do passeio (descricao cadastrada no tour). */
  generateTourPromo(tour: Tour): string {
    return `*${tour.nome}*

 ${tour.descricao || 'Passeio disponível no Hotel Pipa.'}

*Valor:* ${tour.tipoPreco === 'por_passeio'
      ? `${formatCurrency(tour.precoBase)} por veículo${tour.capacidadeMaxima ? ` (até ${tour.capacidadeMaxima} pessoas)` : ''}`
      : `${formatCurrency(tour.precoBase)} por pessoa`}

Para reservas, entre em contato com a recepção do Hotel Pipa.`.trim();
  },

  sendWhatsAppMessage(phoneNumber: string, message: string): void {
    let clean = phoneNumber.replace(/\D/g, '');
    if (!clean.startsWith('55')) clean = `55${clean}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
  },

  sendAgencyReport(sale: SaleWithDetails, agencyPhone: string): void {
    this.sendWhatsAppMessage(agencyPhone, this.generateAgencyReport(sale));
  },

  sendGuestConfirmation(sale: SaleWithDetails, guestPhone: string): void {
    this.sendWhatsAppMessage(guestPhone, this.generateGuestConfirmation(sale));
  },

  sendTourPromo(tour: Tour, phone: string): void {
    this.sendWhatsAppMessage(phone, this.generateTourPromo(tour));
  },
};