// src/components/lostAndFound/LostItemModal.tsx

import React from 'react';
import type { LostItem } from '../../types/lostAndFound.types';
import { StatusBadge } from './StatusBadge';
import { LostItemLabel } from './LostItemLabel';
import { ImageGallery } from './ImageGallery'; // 🆕 Importação da galeria
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LostItemModalProps {
  item: LostItem;
  onClose: () => void;
  onEdit: () => void;
}

const categoryLabels: Record<string, string> = {
  eletrônico:     'Eletrônico',
  documento:      'Documento',
  roupa:          'Roupa',
  acessório:      'Acessório',
  bagagem:        'Bagagem',
  objeto_pessoal: 'Objeto Pessoal',
  outro:          'Outro',
};

const categoryEmoji: Record<string, string> = {
  eletrônico:     '📱',
  documento:      '📄',
  roupa:          '👕',
  acessório:      '💍',
  bagagem:        '🧳',
  objeto_pessoal: '🎒',
  outro:          '📦',
};

const InfoRow: React.FC<{ label: string; value?: string | null; className?: string }> = ({
  label,
  value,
  className = '',
}) =>
  value ? (
    <div className={className}>
      <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  ) : null;

export const LostItemModal: React.FC<LostItemModalProps> = ({ item, onClose, onEdit }) => {
  const handleWhatsApp = () => {
    const msg = `*HOTEL PIPA – ACHADOS E PERDIDOS*\n\n🆔 *Código:* ${item.uniqueCode}\n📅 *Data:* ${item.foundDate.toLocaleDateString('pt-BR')}\n🏷️ *Categoria:* ${categoryLabels[item.category] || item.category}\n📝 *Descrição:* ${item.description}\n${item.color ? `🎨 *Cor:* ${item.color}\n` : ''}📍 *Local:* ${item.foundLocation}\n👤 *Entregue por:* ${item.deliveredBy}`;
    window.open(`https://wa.me/5584999999999?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
              {categoryEmoji[item.category] || '📦'}
            </div>
            <div>
              <p className="font-mono text-lg font-black text-blue-600 dark:text-blue-400 leading-none">
                {item.uniqueCode}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Cadastrado em {format(item.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 🆕 Galeria de Fotos */}
        <div className="px-6 pt-6 space-y-4">
          <ImageGallery 
            photos={item.photos} 
            photoURL={item.photoURL}
            alt={item.description}
          />
        </div>

        {/* Corpo */}
        <div className="p-6 grid grid-cols-2 gap-4">
          <InfoRow label="Categoria" value={`${categoryEmoji[item.category] || ''} ${categoryLabels[item.category] || item.category}`} />
          <InfoRow label="Cor" value={item.color || '—'} />
          <InfoRow
            label="Data encontrado"
            value={format(item.foundDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          />
          <InfoRow label="Local encontrado" value={item.foundLocation} />
          <div className="col-span-2">
            <InfoRow label="Descrição" value={item.description} />
          </div>
          <InfoRow label="Entregue por" value={`${item.deliveredBy}${item.deliveredByPhone ? ` · ${item.deliveredByPhone}` : ''}`} />
          <InfoRow label="Cadastrado por" value={item.createdBy} />

          {item.status === 'entregue' && (
            <>
              <InfoRow label="Retirado por" value={item.returnedTo} />
              <InfoRow
                label="Data da retirada"
                value={item.returnedDate ? format(item.returnedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : undefined}
              />
            </>
          )}

          {item.observations && (
            <div className="col-span-2 mt-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3">
              <span className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                Observações
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-200">{item.observations}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <LostItemLabel item={item} />
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all active:scale-95"
            >
              💬 WhatsApp
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            {item.status === 'guardado' && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
              >
                ✏️ Editar Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};