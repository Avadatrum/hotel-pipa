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
   * Verifica se Web Share API está disponível
   */
  isWebShareAvailable(): boolean {
    return typeof navigator !== 'undefined' && 
           typeof navigator.share === 'function' &&
           typeof navigator.canShare === 'function';
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
   * 🆕 Envia apenas fotos do passeio
   */
  async sendTourPhotos(tour: Tour, phone: string) {
    const fotos = tour.fotos || [];
    if (fotos.length === 0) {
      alert('Este passeio não possui fotos cadastradas.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Tentar usar Web Share API (funciona em mobile)
    if (this.isWebShareAvailable()) {
      try {
        // Buscar as imagens e converter para arquivos
        const files = await Promise.all(
          fotos.slice(0, 10).map(async (url, index) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], `passeio_${index + 1}.jpg`, { type: 'image/jpeg' });
          })
        );

        // Verificar se pode compartilhar esses arquivos
        if (navigator.canShare({ files })) {
          await navigator.share({
            title: tour.nome,
            text: this.generateTourPromo(tour),
            files: files
          });
          return;
        }
      } catch (error) {
        console.log('Web Share API não suportada ou cancelada');
      }
    }
    
    // Fallback: Abrir WhatsApp Web com instruções
    const message = `📸 *${tour.nome}*\n\n` +
      `Olá! Seguem as informações do passeio.\n\n` +
      `📸 *Fotos:* As imagens estão disponíveis na galeria do passeio.\n` +
      `Para receber as fotos, solicite que enviemos por aqui!\n\n` +
      `📞 Entre em contato para mais informações!`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => {
      alert(`📸 Como enviar as ${fotos.length} foto(s):\n\n1. Acesse a galeria do passeio no sistema\n2. Salve as imagens no seu dispositivo\n3. No WhatsApp, clique em anexar (📎)\n4. Selecione as fotos salvas`);
    }, 1000);
  },

  /**
   * 🆕 Envia texto + fotos
   */
  async sendTourWithPhotos(tour: Tour, phone: string) {
    const fotos = tour.fotos || [];
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se não tem fotos, envia só texto
    if (fotos.length === 0) {
      this.sendTourPromo(tour, phone);
      return;
    }
    
    // Tentar Web Share API
    if (this.isWebShareAvailable()) {
      try {
        const files = await Promise.all(
          fotos.slice(0, 10).map(async (url, index) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], `passeio_${index + 1}.jpg`, { type: 'image/jpeg' });
          })
        );

        if (navigator.canShare({ files })) {
          await navigator.share({
            title: tour.nome,
            text: this.generateTourPromo(tour),
            files: files
          });
          return;
        }
      } catch (error) {
        console.log('Web Share API não suportada ou cancelada');
      }
    }
    
    // Fallback: WhatsApp Web com instruções
    const message = this.generateTourPromo(tour) + 
      '\n\n📸 *Fotos do passeio:*\n' +
      `O passeio possui ${fotos.length} foto(s) na galeria.\n` +
      'Solicite que enviemos as imagens por aqui!';
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => {
      alert(`📸 Para enviar as ${fotos.length} foto(s):\n\n1. Acesse a galeria do passeio no sistema\n2. Salve as imagens no seu dispositivo\n3. No WhatsApp, clique em anexar (📎)\n4. Selecione as fotos salvas`);
    }, 1000);
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