// src/components/commissions/TourDetailModal.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';
import { TourGalleryManager } from './TourGalleryManager';
import { communicationTourService } from '../../services/communicationTourService';
import type { Tour } from '../../types';

interface TourDetailModalProps {
  tour: Tour | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function TourDetailModal({ tour, onClose, onUpdate }: TourDetailModalProps) {
  const { showToast } = useToast();
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [sendMode, setSendMode] = useState<'text' | 'photos' | 'both'>('both');

  useEffect(() => {
    if (tour) {
      setDescricao(tour.descricao || '');
    }
  }, [tour]);

  if (!tour) return null;

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        descricao,
        updatedAt: new Date()
      });
      showToast('Descrição atualizada!', 'success');
      onUpdate();
    } catch (error) {
      showToast('Erro ao salvar descrição', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = () => {
    if (!phone.trim()) {
      showToast('Digite um número de telefone', 'warning');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    if (sendMode === 'text') {
      communicationTourService.sendTourPromo(tour, cleanPhone);
    } else if (sendMode === 'photos') {
      communicationTourService.sendTourPhotos(tour, cleanPhone);
    } else {
      communicationTourService.sendTourWithPhotos(tour, cleanPhone);
    }
    
    showToast('WhatsApp aberto!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {tour.nome}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Editar informações e fotos
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Descrição do Passeio
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva o passeio para enviar aos clientes..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSaveDescription}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Descrição'}
              </button>
            </div>
          </div>

          {/* Galeria de Fotos */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Galeria de Fotos
            </label>
            <TourGalleryManager tour={tour} onUpdate={onUpdate} />
          </div>

          {/* Envio WhatsApp */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Enviar para Cliente
            </label>
            
            {/* Campo de telefone */}
            <div className="mb-4">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Número do WhatsApp (ex: 84999999999)"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Digite o número completo com DDD (sem +55 automático)
              </p>
            </div>

            {/* Botões de envio */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSendMode('text');
                  setTimeout(handleSend, 100);
                }}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors text-center"
              >
                <div className="text-xl mb-1">📝</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Só Texto
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSendMode('photos');
                  setTimeout(handleSend, 100);
                }}
                disabled={!tour.fotos || tour.fotos.length === 0}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-colors text-center disabled:opacity-50"
              >
                <div className="text-xl mb-1">🖼️</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Só Fotos
                </div>
              </button>
              
              <button
                onClick={() => {
                  setSendMode('both');
                  setTimeout(handleSend, 100);
                }}
                className="p-3 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:border-green-500 transition-colors text-center"
              >
                <div className="text-xl mb-1">✨</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Texto + Fotos
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}