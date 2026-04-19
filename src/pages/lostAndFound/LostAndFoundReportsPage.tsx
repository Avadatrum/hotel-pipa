// src/pages/lostAndFound/LostAndFoundReportsPage.tsx
//
// Dependências necessárias (adicione ao package.json se ainda não tiver):
//   npm install jspdf jspdf-autotable xlsx
//
// O envio para grupo WhatsApp abre o wa.me com a mensagem pré-preenchida.
// Para envio direto a um grupo, configure o número/link do grupo em WHATSAPP_GROUP.

import React, { useState } from 'react';
import { useLostAndFound } from '../../contexts/LostAndFoundContext';
import { StatusBadge } from '../../components/lostAndFound/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LostItem, ItemStatus } from '../../types/lostAndFound.types';

// ⚠️  Configure aqui o número do grupo de WhatsApp da recepção (somente dígitos, com DDI)
const WHATSAPP_GROUP = '5584999999999';

const categoryLabel: Record<string, string> = {
  eletrônico: 'Eletrônico', documento: 'Documento', roupa: 'Roupa',
  acessório: 'Acessório', bagagem: 'Bagagem', objeto_pessoal: 'Obj. Pessoal', outro: 'Outro',
};

const statusLabel: Record<ItemStatus, string> = {
  guardado: 'Guardado', entregue: 'Entregue', descartado: 'Descartado',
};

// ── Helpers de exportação ──────────────────────────────────────────────────

async function exportPDF(items: LostItem[], title: string) {
  // Importação dinâmica para não aumentar o bundle inicial
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  // Cabeçalho
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('🌴 HOTEL PIPA – ACHADOS & PERDIDOS', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${title}   •   Gerado em ${now}`, 14, 22);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 34,
    head: [['Código', 'Categoria', 'Descrição', 'Cor', 'Data', 'Local', 'Entregue por', 'Status', 'Retirado por']],
    body: items.map((i) => [
      i.uniqueCode,
      categoryLabel[i.category] || i.category,
      i.description,
      i.color || '—',
      format(i.foundDate, 'dd/MM/yyyy', { locale: ptBR }),
      i.foundLocation,
      i.deliveredBy,
      statusLabel[i.status],
      i.returnedTo || '—',
    ]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 2: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  // Rodapé com total
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Total de itens: ${items.length}   •   Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`achados-perdidos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

async function exportExcel(items: LostItem[], sheetName: string) {
  const XLSX = await import('xlsx');

  const data = items.map((i) => ({
    Código: i.uniqueCode,
    Categoria: categoryLabel[i.category] || i.category,
    Descrição: i.description,
    Cor: i.color || '',
    'Data Encontrado': format(i.foundDate, 'dd/MM/yyyy', { locale: ptBR }),
    'Local Encontrado': i.foundLocation,
    'Entregue por': i.deliveredBy,
    'Telefone': i.deliveredByPhone || '',
    Status: statusLabel[i.status],
    'Retirado por': i.returnedTo || '',
    'Data Retirada': i.returnedDate ? format(i.returnedDate, 'dd/MM/yyyy', { locale: ptBR }) : '',
    Observações: i.observations || '',
    'Cadastrado por': i.createdBy,
    'Data Cadastro': format(i.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Largura das colunas
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 10 }, { wch: 14 }, { wch: 20 },
    { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
    { wch: 18 }, { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `achados-perdidos-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

function buildWhatsAppSummary(items: LostItem[]): string {
  const stored    = items.filter((i) => i.status === 'guardado');
  const returned  = items.filter((i) => i.status === 'entregue');
  const discarded = items.filter((i) => i.status === 'descartado');
  const now       = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  let msg =
    `*🌴 HOTEL PIPA – ACHADOS & PERDIDOS*\n` +
    `📅 Relatório gerado em ${now}\n\n` +
    `📊 *RESUMO GERAL*\n` +
    `• Total de itens: *${items.length}*\n` +
    `• 📦 Aguardando retirada: *${stored.length}*\n` +
    `• ✅ Entregues: *${returned.length}*\n` +
    `• 🗑️ Descartados: *${discarded.length}*\n`;

  if (stored.length > 0) {
    msg += `\n📦 *ITENS AGUARDANDO RETIRADA*\n`;
    stored.slice(0, 15).forEach((i) => {
      msg += `• \`${i.uniqueCode}\` – ${i.description} (${format(i.foundDate, 'dd/MM', { locale: ptBR })})\n`;
    });
    if (stored.length > 15) msg += `_...e mais ${stored.length - 15} itens._\n`;
  }

  msg += `\n_Acesse o sistema para detalhes completos._`;
  return msg;
}

// ── Componente ────────────────────────────────────────────────────────────

type FilterStatus = ItemStatus | 'all';
type DateRange = { start: string; end: string };

export const LostAndFoundReportsPage: React.FC = () => {
  const { items } = useLostAndFound();

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [dateRange, setDateRange]       = useState<DateRange>({ start: '', end: '' });
  const [exporting, setExporting]       = useState<'pdf' | 'excel' | 'wa' | null>(null);

  // ── Filtragem local para preview do relatório ──
  const filtered = items.filter((i) => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (dateRange.start && i.foundDate < new Date(dateRange.start)) return false;
    if (dateRange.end   && i.foundDate > new Date(dateRange.end + 'T23:59:59')) return false;
    return true;
  });

  const reportTitle = `Relatório${statusFilter !== 'all' ? ` – ${statusLabel[statusFilter as ItemStatus]}` : ''}${
    dateRange.start ? ` de ${format(new Date(dateRange.start), 'dd/MM/yyyy')}` : ''
  }${dateRange.end ? ` até ${format(new Date(dateRange.end), 'dd/MM/yyyy')}` : ''}`;

  const handleExport = async (type: 'pdf' | 'excel' | 'wa') => {
    setExporting(type);
    try {
      if (type === 'pdf')   await exportPDF(filtered, reportTitle);
      if (type === 'excel') await exportExcel(filtered, 'Achados & Perdidos');
      if (type === 'wa') {
        const msg = buildWhatsAppSummary(filtered);
        window.open(`https://wa.me/${WHATSAPP_GROUP}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } finally {
      setExporting(null);
    }
  };

  // ── Stats rápidos ──
  const byCategory = filtered.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  const inputCls =
    'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  const exportBtn = (
    type: 'pdf' | 'excel' | 'wa',
    label: string,
    emoji: string,
    cls: string
  ) => (
    <button
      onClick={() => handleExport(type)}
      disabled={filtered.length === 0 || exporting !== null}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {exporting === type ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{emoji}</span>
      )}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">

      {/* Configurar relatório */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5 space-y-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Configurar Relatório
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className={`w-full ${inputCls}`}
            >
              <option value="all">Todos os status</option>
              <option value="guardado">📦 Guardado</option>
              <option value="entregue">✅ Entregue</option>
              <option value="descartado">🗑️ Descartado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Data inicial</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              className={`w-full ${inputCls}`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Data final</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              className={`w-full ${inputCls}`}
            />
          </div>
        </div>

        {/* Botões de exportação */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {filtered.length} {filtered.length === 1 ? 'item' : 'itens'} no relatório
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {exportBtn('pdf',   'Exportar PDF',   '📄', 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20')}
            {exportBtn('excel', 'Exportar Excel', '📊', 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20')}
            {exportBtn('wa',    'Enviar ao Grupo WhatsApp', '💬', 'bg-[#25D366] hover:bg-[#1ebe5d] shadow-md shadow-green-600/20')}
          </div>
        </div>
      </div>

      {/* Preview resumido por categoria */}
      {filtered.length > 0 && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            Prévia — Distribuição por Categoria
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {categoryLabel[cat] || cat}
                  </span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabela de preview */}
      {filtered.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Itens incluídos no relatório
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-50 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
                <tr>
                  {['Código', 'Categoria', 'Descrição', 'Data', 'Local', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filtered.slice(0, 50).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs whitespace-nowrap">{item.uniqueCode}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">{categoryLabel[item.category] || item.category}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">{item.description}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{format(item.foundDate, 'dd/MM/yyyy', { locale: ptBR })}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.foundLocation}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-800">
                Mostrando 50 de {filtered.length} itens. O relatório exportado incluirá todos.
              </div>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
          <span className="text-4xl mb-3">📊</span>
          <p className="font-semibold">Nenhum item com estes filtros</p>
          <p className="text-sm mt-1">Ajuste o status ou o período acima.</p>
        </div>
      )}
    </div>
  );
};