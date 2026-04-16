// src/services/communicationTourService.ts
import type { Tour, Sale } from '../types';
import { formatCurrency, formatDate, safeToDate } from '../utils/commissionCalculations';

export const communicationTourService = {
  /**
   * Gera texto descritivo do passeio
   */
  generateTourPromo(tour: Tour): string {
    const lines: string[] = [];
    
    lines.push(`*${tour.nome}*`);
    lines.push('');
    
    if (tour.descricao) {
      lines.push(tour.descricao);
      lines.push('');
    }
    
    lines.push(`📊 *Informações:*`);
    lines.push(`• Preço: ${formatCurrency(tour.precoBase)} ${tour.tipoPreco === 'por_pessoa' ? 'por pessoa' : 'por saída'}`);
    
    if (tour.tipoPreco === 'por_passeio' && tour.capacidadeMaxima) {
      lines.push(`• Capacidade: até ${tour.capacidadeMaxima} pessoas`);
    }
    
    lines.push('');
    lines.push(`📞 *Reservas e informações:*`);
    lines.push(`Entre em contato conosco para garantir sua vaga!`);
    
    return lines.join('\n');
  },

  /**
   * Envia apenas texto do passeio
   */
  sendTourPromo(tour: Tour, phone: string) {
    const message = this.generateTourPromo(tour);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  },

  /**
   * Envia apenas fotos do passeio
   */
  sendTourPhotos(tour: Tour, phone: string) {
    const fotos = tour.fotos || [];
    if (fotos.length === 0) return;
    
    const message = `📸 *Fotos - ${tour.nome}*\n\nConfira as fotos deste passeio incrível!`;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    // Nota: WhatsApp Web não suporta envio múltiplo de mídia via URL.
    // As fotos precisam ser enviadas manualmente após abrir o chat.
  },

  /**
   * Envia texto + fotos
   */
  sendTourWithPhotos(tour: Tour, phone: string) {
    const message = this.generateTourPromo(tour) + '\n\n📸 *Fotos do passeio em anexo!*';
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  },

  /**
   * Relatório para agência
   */
  generateAgencyReport(sales: Sale[], agencyName: string): string {
    const lines: string[] = [];
    const total = sales.reduce((sum, s) => sum + s.comissaoCalculada, 0);
    
    lines.push(`*${agencyName}*`);
    lines.push(`Relatório de Comissões Pendentes`);
    lines.push('');
    lines.push(`📊 *Resumo:*`);
    lines.push(`• Total de vendas: ${sales.length}`);
    lines.push(`• Valor pendente: ${formatCurrency(total)}`);
    lines.push('');
    lines.push(`📋 *Detalhamento:*`);
    
    sales.forEach((sale, index) => {
      lines.push(`${index + 1}. ${sale.passeioNome}`);
      lines.push(`   Cliente: ${sale.clienteNome}`);
      lines.push(`   Data: ${formatDate(safeToDate(sale.dataVenda))}`);
      lines.push(`   Comissão: ${formatCurrency(sale.comissaoCalculada)}`);
      lines.push('');
    });
    
    return lines.join('\n');
  },

  /**
   * Envia relatório para agência
   */
  sendAgencyReport(sale: any, phone: string) {
    const message = `*Relatório de Venda*\n\n` +
      `Passeio: ${sale.passeioNome}\n` +
      `Cliente: ${sale.clienteNome}\n` +
      `Data: ${formatDate(safeToDate(sale.dataVenda))}\n` +
      `Comissão: ${formatCurrency(sale.comissaoCalculada)}`;
    
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  },

  /**
   * Confirmação para hóspede
   */
  sendGuestConfirmation(sale: any, phone: string) {
    const message = `*Confirmação de Passeio*\n\n` +
      `Olá ${sale.clienteNome}!\n\n` +
      `Seu passeio *${sale.passeioNome}* está confirmado para:\n` +
      `📅 Data: ${formatDate(safeToDate(sale.dataPasseioRealizacao))}\n` +
      `🕐 Horário: ${sale.dataPasseioRealizacao?.split(' ')[1] || 'A combinar'}\n\n` +
      `Obrigado por escolher nossos serviços!`;
    
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};