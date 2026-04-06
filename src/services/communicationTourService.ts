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
    return {
      dateObj: new Date(`${datePart}T${timePart}`),
      timeString: timePart,
    };
  }

  const dateObj = new Date(dateString);
  const timeString = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { dateObj, timeString };
}

function descricaoQuantidade(sale: SaleWithDetails): string {
  const tipoPreco = sale.tipoPreco ?? sale.tourData?.tipoPreco ?? 'por_pessoa';
  const qtdPasseios = sale.quantidade || 1;
  const qtdPessoas = sale.quantidadePessoas || 1;
  const capacidade = sale.tourData?.capacidadeMaxima;

  if (tipoPreco === 'por_passeio') {
    const partes: string[] = [];
    if (qtdPasseios > 1) partes.push(`${qtdPasseios} veículo(s)`);
    partes.push(`${qtdPessoas} pessoa(s)`);
    if (capacidade && capacidade > 0) partes.push(`capacidade máxima: ${capacidade}`);
    return partes.join(' — ');
  }

  // por_pessoa
  if (qtdPasseios > 1) {
    return `${qtdPessoas} pessoa(s) x ${qtdPasseios} saída(s)`;
  }
  return `${qtdPessoas} pessoa(s)`;
}

function descricaoPreco(sale: SaleWithDetails): string {
  const tipoPreco = sale.tipoPreco ?? sale.tourData?.tipoPreco ?? 'por_pessoa';
  const precoUnitario = sale.precoUnitarioVendido ?? sale.tourData?.precoBase ?? 0;
  const qtdPasseios = sale.quantidade || 1;

  if (tipoPreco === 'por_passeio') {
    const label = qtdPasseios > 1
      ? `${formatCurrency(precoUnitario)} por veículo x ${qtdPasseios}`
      : `${formatCurrency(precoUnitario)} por veículo`;
    return `${label} = ${formatCurrency(sale.valorTotal)}`;
  }

  const qtdPessoas = sale.quantidadePessoas || 1;
  const label = qtdPasseios > 1
    ? `${formatCurrency(precoUnitario)} por pessoa x ${qtdPessoas} x ${qtdPasseios} saída(s)`
    : `${formatCurrency(precoUnitario)} por pessoa x ${qtdPessoas}`;
  return `${label} = ${formatCurrency(sale.valorTotal)}`;
}

export const communicationTourService = {
  /**
   * Gera relatório formatado para envio à agência via WhatsApp.
   * Inclui dados de comissão — informação relevante para a agência.
   */
  generateAgencyReport(sale: SaleWithDetails): string {
    const { dateObj, timeString } = parseDataPasseio(sale.dataPasseioRealizacao);
    const dataFormatada = formatDate(dateObj);
    const horario = timeString ? ` às ${timeString}` : '';

    return `
*RELATÓRIO DE PASSEIO — HOTEL PIPA*

*Passeio:* ${sale.passeioNome}
*Cliente:* ${sale.clienteNome}${sale.clienteTelefone ? `\n*Telefone:* ${sale.clienteTelefone}` : ''}
*Data:* ${dataFormatada}${horario}
*Participantes:* ${descricaoQuantidade(sale)}

*Detalhamento de Preço:*
${descricaoPreco(sale)}
*Comissão:* ${formatCurrency(sale.comissaoCalculada)}

${sale.observacoes ? `*Observações:* ${sale.observacoes}` : ''}
---
Hotel Pipa — Sistema de Gestão
${new Date().toLocaleString('pt-BR')}
    `.trim();
  },

  /**
   * Gera confirmação de passeio para o hóspede via WhatsApp.
   * Não inclui dados de comissão — foco na experiência do cliente.
   */
  generateGuestConfirmation(sale: SaleWithDetails): string {
    const { dateObj, timeString } = parseDataPasseio(sale.dataPasseioRealizacao);
    const dataFormatada = formatDate(dateObj);
    const horario = timeString ? ` às ${timeString}` : '';
    const tipoPreco = sale.tipoPreco ?? sale.tourData?.tipoPreco ?? 'por_pessoa';
    const qtdPessoas = sale.quantidadePessoas || 1;

    const linhaParticipantes = tipoPreco === 'por_passeio'
      ? `*Participantes:* ${qtdPessoas} pessoa(s)`
      : `*Participantes:* ${qtdPessoas} pessoa(s)`;

    return `
*CONFIRMAÇÃO DE PASSEIO — HOTEL PIPA*

Olá, ${sale.clienteNome}! Seu passeio foi confirmado com sucesso.

*Passeio:* ${sale.passeioNome}
*Data:* ${dataFormatada}${horario}
${linhaParticipantes}
*Valor:* ${formatCurrency(sale.valorTotal)}

*O que levar:*
- Protetor solar e repelente
- Roupa de banho e toalha
- Dinheiro para despesas extras

Favor estar no lobby 15 minutos antes do horário de saída.

Dúvidas? Entre em contato conosco.

Hotel Pipa
    `.trim();
  },

  sendWhatsAppMessage(phoneNumber: string, message: string): void {
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = `55${cleanPhone}`;
    }
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  },

  sendAgencyReport(sale: SaleWithDetails, agencyPhone: string): void {
    const report = this.generateAgencyReport(sale);
    this.sendWhatsAppMessage(agencyPhone, report);
  },

  sendGuestConfirmation(sale: SaleWithDetails, guestPhone: string): void {
    const confirmation = this.generateGuestConfirmation(sale);
    this.sendWhatsAppMessage(guestPhone, confirmation);
  },
};