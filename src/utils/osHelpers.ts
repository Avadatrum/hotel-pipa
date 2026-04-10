// src/utils/osHelpers.ts
import { type OSStatus, type OSType, OS_TIPOS, OS_STATUS } from '../types/serviceOrder.types';

// Gerar número sequencial da OS
export function generateOSNumber(existingNumbers: string[]): string {
  const numbers = existingNumbers
    .map(n => parseInt(n.replace('OS-', '')))
    .filter(n => !isNaN(n));
  
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `OS-${String(nextNumber).padStart(3, '0')}`;
}

// Formatar data para exibição
export function formatOSDate(date: string | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch {
    return '—';
  }
}

// Formatar data com hora
export function formatOSDateTime(date: string | undefined): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

// Calcular tempo decorrido
export function calculateElapsedTime(dataCriacao: string, dataConclusao?: string): string {
  if (!dataCriacao) return '—';
  
  const inicio = new Date(dataCriacao);
  const fim = dataConclusao ? new Date(dataConclusao) : new Date();
  const diffMs = fim.getTime() - inicio.getTime();
  
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) {
    return `${dias}d ${horas}h`;
  }
  return `${horas}h`;
}

// Verificar se prazo está vencido
export function isPrazoVencido(prazo?: string, status?: OSStatus): boolean {
  if (!prazo || status === 'concluida' || status === 'cancelada') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataPrazo = new Date(prazo);
  dataPrazo.setHours(0, 0, 0, 0);
  return dataPrazo < hoje;
}

// Obter label do tipo
export function getOSTipoLabel(tipo: OSType): string {
  return OS_TIPOS.find(t => t.value === tipo)?.label || tipo;
}

// Obter ícone do tipo
export function getOSTipoIcon(tipo: OSType): string {
  return OS_TIPOS.find(t => t.value === tipo)?.icon || '📋';
}

// Obter configuração do status
export function getOSStatusConfig(status: OSStatus) {
  return OS_STATUS.find(s => s.value === status) || OS_STATUS[0];
}

// Gerar mensagem para WhatsApp
export function generateOSWhatsAppMessage(os: any): string {
  // const status = getOSStatusConfig(os.status); -> REMOVIDO AQUI
  
  return `🛠️ *NOVA ORDEM DE SERVIÇO*\n\n` +
    `*Número:* ${os.numero}\n` +
    `*Título:* ${os.titulo}\n` +
    `*Tipo:* ${getOSTipoLabel(os.tipo)}\n` +
    `*Local:* ${os.local}\n` +
    `*Solicitante:* ${os.solicitanteNome}\n\n` +
    `*Descrição:*\n${os.descricao}\n\n` +
    `_Gerado pelo HPanel_`;
}

// Gerar link WhatsApp
export function generateOSWhatsAppLink(os: any, phoneNumber?: string): string {
  const message = generateOSWhatsAppMessage(os);
  const encodedMessage = encodeURIComponent(message);
  const phone = phoneNumber || '';
  return `https://wa.me/${phone}?text=${encodedMessage}`;
}

// Agrupar OS por status
export function groupOSByStatus(orders: any[]) {
  return {
    abertas: orders.filter(o => o.status === 'aberta'),
    emAndamento: orders.filter(o => o.status === 'em_andamento'),
    concluidas: orders.filter(o => o.status === 'concluida'),
    canceladas: orders.filter(o => o.status === 'cancelada'),
  };
}

// Calcular métricas
export function calculateOSMetrics(orders: any[]): any {
  const concluidas = orders.filter(o => o.status === 'concluida');
  
  const tempoMedio = concluidas.reduce((acc, o) => {
    if (o.dataCriacao && o.dataConclusao) {
      const diff = new Date(o.dataConclusao).getTime() - new Date(o.dataCriacao).getTime();
      return acc + diff / (1000 * 60 * 60);
    }
    return acc;
  }, 0) / (concluidas.length || 1);
  
  const now = new Date();
  const thisMonth = orders.filter(o => {
    const created = new Date(o.dataCriacao);
    return created.getMonth() === now.getMonth() && 
           created.getFullYear() === now.getFullYear();
  });
  
  return {
    total: orders.length,
    abertas: orders.filter(o => o.status === 'aberta').length,
    emAndamento: orders.filter(o => o.status === 'em_andamento').length,
    concluidas: concluidas.length,
    canceladas: orders.filter(o => o.status === 'cancelada').length,
    tempoMedioConclusao: Math.round(tempoMedio * 10) / 10,
    thisMonth: thisMonth.length,
  };
}

// Validar formulário de OS
export function validateOSForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.titulo?.trim()) errors.titulo = 'Título é obrigatório';
  if (!data.descricao?.trim()) errors.descricao = 'Descrição é obrigatória';
  if (!data.tipo) errors.tipo = 'Tipo é obrigatório';
  if (!data.local?.trim()) errors.local = 'Local é obrigatório';
  
  return errors;
}