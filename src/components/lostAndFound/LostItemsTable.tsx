// src/components/lostAndFound/LostItemsTable.tsx

import React, { useState } from 'react';
import type { LostItem, ItemStatus } from '../../types/lostAndFound.types';
import { StatusBadge } from './StatusBadge';
import { ItemImage } from './ItemImage'; 
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LostItemsTableProps {
  items: LostItem[];
  onView: (item: LostItem) => void;
  onEdit: (item: LostItem) => void;
  onReturn: (item: LostItem) => void;
  onDiscard: (item: LostItem) => void;
  onDelete: (item: LostItem) => void;
  onPrintLabel: (item: LostItem) => void;
  onSendWhatsApp: (item: LostItem) => void;
}

const categoryEmoji: Record<string, string> = {
  eletrônico:     '📱',
  documento:      '📄',
  roupa:          '👕',
  acessório:      '💍',
  bagagem:        '🧳',
  objeto_pessoal: '🎒',
  outro:          '📦',
};

const categoryLabel: Record<string, string> = {
  eletrônico:     'Eletrônico',
  documento:      'Documento',
  roupa:          'Roupa',
  acessório:      'Acessório',
  bagagem:        'Bagagem',
  objeto_pessoal: 'Obj. Pessoal',
  outro:          'Outro',
};

type SortKey = 'foundDate' | 'category' | 'status' | 'uniqueCode';

export const LostItemsTable: React.FC<LostItemsTableProps> = ({
  items,
  onView,
  onEdit,
  onReturn,
  onDiscard,
  onDelete,
  onPrintLabel,
  onSendWhatsApp,
}) => {
  const [filterStatus, setFilterStatus] = useState<ItemStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('foundDate');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const filtered = (filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus))
    .slice()
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'foundDate') cmp = a.foundDate.getTime() - b.foundDate.getTime();
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'uniqueCode') cmp = a.uniqueCode.localeCompare(b.uniqueCode);
      return sortAsc ? cmp : -cmp;
    });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-blue-500">{sortAsc ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-slate-300 dark:text-slate-600">↕</span>
    );

  const thCls =
    'px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap';

  const tabBtnCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
      active
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="space-y-3">
      {/* Tabs de status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(['all', 'guardado', 'entregue', 'descartado'] as const).map((s) => {
            const labels: Record<string, string> = {
              all: `Todos (${items.length})`,
              guardado: `📦 Guardado (${items.filter(i => i.status === 'guardado').length})`,
              entregue: `✅ Entregue (${items.filter(i => i.status === 'entregue').length})`,
              descartado: `🗑️ Descartado (${items.filter(i => i.status === 'descartado').length})`,
            };
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={tabBtnCls(filterStatus === s)}>
                {labels[s]}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700/60">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr>
              <th className={thCls} onClick={() => handleSort('uniqueCode')}>
                Código <SortIcon k="uniqueCode" />
              </th>
              {/* Coluna Foto */}
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Foto
              </th>
              <th className={thCls} onClick={() => handleSort('category')}>
                Categoria <SortIcon k="category" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Descrição
              </th>
              <th className={thCls} onClick={() => handleSort('foundDate')}>
                Data <SortIcon k="foundDate" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Entregue por
              </th>
              <th className={thCls} onClick={() => handleSort('status')}>
                Status <SortIcon k="status" />
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                  Nenhum item nesta categoria.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* Código */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onView(item)}
                      className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {item.uniqueCode}
                    </button>
                  </td>

                  {/* 🆕 Coluna Foto no corpo da tabela com Key para forçar atualização */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ItemImage 
                      key={item.photoURL || 'no-photo'} // 🆕 Força re-render quando URL muda
                      photoURL={item.photoURL} 
                      alt={item.description} 
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>

                  {/* Categoria */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <span>{categoryEmoji[item.category] || '📦'}</span>
                      <span className="text-xs font-medium">{categoryLabel[item.category] || item.category}</span>
                    </span>
                  </td>

                  {/* Descrição */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate" title={item.description}>
                      {item.description}
                    </p>
                    {item.color && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.color}</p>
                    )}
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {format(item.foundDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </td>

                  {/* Entregue por */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{item.deliveredBy}</p>
                    {item.deliveredByPhone && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">{item.deliveredByPhone}</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ActionBtn onClick={() => onView(item)} title="Visualizar" emoji="👁️" color="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30" />
                      <ActionBtn onClick={() => onEdit(item)} title="Editar" emoji="✏️" color="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" />
                      {item.status === 'guardado' && (
                        <>
                          <ActionBtn onClick={() => onReturn(item)} title="Marcar como entregue" emoji="📦" color="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" />
                          <ActionBtn onClick={() => onDiscard(item)} title="Descartar" emoji="🗑️" color="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30" />
                        </>
                      )}
                      <ActionBtn onClick={() => onPrintLabel(item)} title="Imprimir etiqueta" emoji="🖨️" color="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" />
                      <ActionBtn onClick={() => onSendWhatsApp(item)} title="Enviar via WhatsApp" emoji="💬" color="text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30" />
                      <ActionBtn onClick={() => onDelete(item)} title="Excluir" emoji="❌" color="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  emoji: string;
  color: string;
}> = ({ onClick, title, emoji, color }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all duration-150 active:scale-90 ${color}`}
  >
    {emoji}
  </button>
);