// src/components/commissions/AgencyReportModal.tsx
import { useState } from 'react';
import { formatCurrency, formatDate, safeToDate } from '../../utils/commissionCalculations';
import type { AgencyCommissionReport } from '../../types';

interface AgencyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AgencyCommissionReport | null;
}

export function AgencyReportModal({ isOpen, onClose, report }: AgencyReportModalProps) {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen || !report) return null;

  const generateWhatsAppMessage = () => {
    const lines: string[] = [];
    
    if (includeHeader) {
      lines.push(`*${report.agencyName}*`);
      lines.push(`Relatório de Comissões Pendentes`);
      lines.push(`Período: ${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`);
      lines.push(``);
    }
    
    lines.push(`📊 *Resumo:*`);
    lines.push(`• Total de vendas: ${report.pendingSales.length}`);
    lines.push(`• Valor pendente: ${formatCurrency(report.totalPending)}`);
    lines.push(``);
    
    if (report.pendingSales.length > 0) {
      lines.push(`📋 *Detalhamento:*`);
      report.pendingSales.forEach((sale, index) => {
        lines.push(`${index + 1}. ${sale.passeioNome}`);
        lines.push(`   Cliente: ${sale.clienteNome}`);
        lines.push(`   Data: ${formatDate(safeToDate(sale.dataVenda))}`);
        lines.push(`   Comissão: ${formatCurrency(sale.comissaoCalculada)}`);
        if (sale.observacoes) {
          lines.push(`   Obs: ${sale.observacoes}`);
        }
        lines.push(``);
      });
    }
    
    if (customMessage) {
      lines.push(`📝 *Observações:*`);
      lines.push(customMessage);
      lines.push(``);
    }
    
    lines.push(`💳 *Dados para Pagamento:*`);
    lines.push(`PIX: [SEU PIX AQUI]`);
    lines.push(`Banco: [SEUS DADOS BANCÁRIOS]`);
    lines.push(``);
    lines.push(`_Relatório gerado em ${new Date().toLocaleString('pt-BR')}_`);
    
    return lines.join('\n');
  };

  const handleSendWhatsApp = () => {
    if (!report.agencyPhone) return;
    
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = report.agencyPhone.replace(/\D/g, '');
    
    // Abrir WhatsApp sem prefixo automático
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleCopyToClipboard = () => {
    const message = generateWhatsAppMessage();
    navigator.clipboard?.writeText(message);
    alert('Relatório copiado para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                📊 Relatório para Agência
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {report.agencyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Vendas Pendentes</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {report.pendingSales.length}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
              <p className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wide">Valor Total</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(report.totalPending)}
              </p>
            </div>
          </div>

          {/* Configurações da Mensagem */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeHeader}
                onChange={e => setIncludeHeader(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Incluir cabeçalho com período
              </span>
            </label>
            
            <textarea
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Mensagem adicional (opcional)..."
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Prévia da Mensagem
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {generateWhatsAppMessage()}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            📋 Copiar
          </button>
          <button
            onClick={handleSendWhatsApp}
            disabled={!report.agencyPhone}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <span>📱</span>
            Enviar WhatsApp
            {!report.agencyPhone && (
              <span className="text-xs opacity-75">(sem telefone)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}