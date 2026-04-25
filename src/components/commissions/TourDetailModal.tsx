// src/components/commissions/TourDetailModal.tsx - ATUALIZADO
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';
import { TourGalleryManager } from './TourGalleryManager';
import { RichTextEditor } from './RichTextEditor'; // 🆕
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
  const [nome, setNome] = useState(''); // 🆕
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [sendMode, setSendMode] = useState<'text' | 'photos' | 'both'>('both');
  const [activeTab, setActiveTab] = useState<'descricao' | 'fotos'>('descricao'); // 🆕

  useEffect(() => {
    if (tour) {
      setDescricao(tour.descricao || '');
      setNome(tour.nome || '');
    }
  }, [tour]);

  if (!tour) return null;

  const handleSaveDescription = async () => {
    if (!descricao.trim()) {
      showToast('A descrição não pode ficar vazia', 'warning');
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'tours', tour.id), {
        descricao,
        nome: nome.trim(),
        updatedAt: new Date()
      });
      showToast('Informações atualizadas! ✅', 'success');
      onUpdate();
    } catch (error) {
      showToast('Erro ao salvar', 'error');
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
    
    showToast('WhatsApp aberto! 📱', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Editar: {tour.nome}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personalize a descrição e gerencie as fotos
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          
          {/* 🆕 Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-100 dark:border-gray-800 -mb-[1px]">
            <button
              onClick={() => setActiveTab('descricao')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'descricao'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Descrição
            </button>
            <button
              onClick={() => setActiveTab('fotos')}
              className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'fotos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🖼️ Galeria de Fotos
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'descricao' ? (
            <div className="space-y-4">
              {/* Nome do passeio */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Nome do Passeio
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do passeio"
                />
              </div>

              {/* 🆕 Editor Rico */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Descrição para o site ✨
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Use a barra de ferramentas para formatar o texto. Títulos, negrito, imagens e links.
                </p>
                <RichTextEditor
                  value={descricao}
                  onChange={(value) => setDescricao(value)}
                  placeholder="Descreva o passeio com detalhes atrativos..."
                />
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveDescription}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {saving ? '💾 Salvando...' : '💾 Salvar Alterações'}
                </button>
              </div>
            </div>
          ) : (
            /* Galeria de Fotos */
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Gerenciar Fotos
              </label>
              <TourGalleryManager tour={tour} onUpdate={onUpdate} />
            </div>
          )}

          {/* Envio WhatsApp (sempre visível) */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-6">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              📱 Enviar para WhatsApp
            </label>
            
            <div className="mb-4">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Número do WhatsApp (ex: 84999999999)"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSendMode('text');
                  handleSend();
                }}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors text-center"
              >
                <div className="text-xl mb-1">📝</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Só Texto</div>
              </button>
              
              <button
                onClick={() => {
                  setSendMode('photos');
                  handleSend();
                }}
                disabled={!tour.fotos || tour.fotos.length === 0}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-colors text-center disabled:opacity-50"
              >
                <div className="text-xl mb-1">🖼️</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Só Fotos</div>
              </button>
              
              <button
                onClick={() => {
                  setSendMode('both');
                  handleSend();
                }}
                className="p-3 rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:border-green-500 transition-colors text-center"
              >
                <div className="text-xl mb-1">✨</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Texto + Fotos</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}