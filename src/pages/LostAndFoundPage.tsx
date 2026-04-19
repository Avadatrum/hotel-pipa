// src/pages/LostAndFoundPage.tsx

import React, { useState } from 'react';
import { useLostAndFound } from '../contexts/LostAndFoundContext';
import { LostItemForm } from '../components/lostAndFound/LostItemForm';
import { LostItemsTable } from '../components/lostAndFound/LostItemsTable';
import { LostItemModal } from '../components/lostAndFound/LostItemModal';
import { LostItemLabel } from '../components/lostAndFound/LostItemLabel';
import { LostItemFilters } from '../components/lostAndFound/LostItemFilters';
import { LostAndFoundStats } from '../components/lostAndFound/Lostandfoundstats';
import type { LostItem } from '../types/lostAndFound.types';

export const LostAndFoundPage: React.FC = () => {
  const {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    markAsReturned,
    markAsDiscarded,
    filters,
    setFilters
  } = useLostAndFound();

  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnName, setReturnName] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);

  const handleCreateItem = async (data: any) => {
    await createItem(data);
    setShowForm(false);
  };

  const handleEditItem = async (data: any) => {
    if (selectedItem) {
      await updateItem(selectedItem.id, data);
      setSelectedItem(null);
      setShowForm(false);
    }
  };

  const handleReturnItem = async () => {
    if (selectedItem && returnName) {
      await markAsReturned(selectedItem.id, returnName);
      setShowReturnModal(false);
      setSelectedItem(null);
      setReturnName('');
    }
  };

  const handleDiscardItem = async (item: LostItem) => {
    if (confirm(`Descartar o item ${item.uniqueCode}?`)) {
      await markAsDiscarded(item.id);
    }
  };

  const handleDeleteItem = async (item: LostItem) => {
    if (confirm(`Excluir permanentemente o item ${item.uniqueCode}? Esta ação não pode ser desfeita.`)) {
      await deleteItem(item.id);
    }
  };

  const handleSendWhatsApp = (item: LostItem) => {
    const message = `*HOTEL PIPA – ACHADOS E PERDIDOS*\n\n🆔 *Código:* ${item.uniqueCode}\n📅 *Data:* ${item.foundDate.toLocaleDateString('pt-BR')}\n🏷️ *Categoria:* ${item.category}\n📝 *Descrição:* ${item.description}\n${item.color ? `🎨 *Cor:* ${item.color}\n` : ''}📍 *Local:* ${item.foundLocation}\n👤 *Entregue por:* ${item.deliveredBy}\n📌 *Status:* ${item.status === 'guardado' ? '🔵 AGUARDANDO RETIRADA' : '✅ ENTREGUE'}`;
    window.open(`https://wa.me/5584999999999?text=${encodeURIComponent(message)}`, '_blank');
  };

  const storedCount = items.filter(i => i.status === 'guardado').length;
  const returnedCount = items.filter(i => i.status === 'entregue').length;
  const discardedCount = items.filter(i => i.status === 'descartado').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            🔍 Achados & Perdidos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie itens encontrados no hotel
          </p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200"
        >
          <span className="text-base">＋</span>
          Cadastrar Item
        </button>
      </div>

      {/* Stats Cards */}
      <LostAndFoundStats
        total={items.length}
        stored={storedCount}
        returned={returnedCount}
        discarded={discardedCount}
      />

      {/* Filters */}
      <LostItemFilters filters={filters} onFilterChange={setFilters} />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Carregando itens...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="text-5xl mb-4">📦</span>
          <p className="text-base font-semibold">Nenhum item encontrado</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou cadastre um novo item.</p>
        </div>
      ) : (
        <LostItemsTable
          items={items}
          onView={(item) => { setSelectedItem(item); setShowDetail(true); }}
          onEdit={(item) => { setSelectedItem(item); setShowForm(true); }}
          onReturn={(item) => { setSelectedItem(item); setShowReturnModal(true); }}
          onDiscard={handleDiscardItem}
          onDelete={handleDeleteItem}
          onPrintLabel={(item) => { setSelectedItem(item); setShowLabelModal(true); }}
          onSendWhatsApp={handleSendWhatsApp}
        />
      )}

      {/* ── Modal: Formulário ── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {selectedItem ? '✏️ Editar Item' : '📋 Novo Item'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setSelectedItem(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <LostItemForm
                onSubmit={selectedItem ? handleEditItem : handleCreateItem}
                onCancel={() => { setShowForm(false); setSelectedItem(null); }}
                initialData={selectedItem || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Detalhes ── */}
      {showDetail && selectedItem && (
        <LostItemModal
          item={selectedItem}
          onClose={() => { setShowDetail(false); setSelectedItem(null); }}
          onEdit={() => { setShowDetail(false); setShowForm(true); }}
        />
      )}

      {/* ── Modal: Confirmar Entrega ── */}
      {showReturnModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">📦 Confirmar Entrega</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
                <p className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400">{selectedItem.uniqueCode}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedItem.description}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nome de quem retirou *
                </label>
                <input
                  type="text"
                  value={returnName}
                  onChange={(e) => setReturnName(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Nome completo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button
                onClick={() => { setShowReturnModal(false); setSelectedItem(null); setReturnName(''); }}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReturnItem}
                disabled={!returnName.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ✓ Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Etiqueta para Impressão ── */}
      {showLabelModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">🖨️ Imprimir Etiqueta</h2>
              <button
                onClick={() => setShowLabelModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <LostItemLabel item={selectedItem} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};