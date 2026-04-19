// src/components/lostAndFound/LostItemForm.tsx

import React, { useState, useEffect } from 'react';
import type { LostItemFormData, ItemCategory } from '../../types/lostAndFound.types';

interface LostItemFormProps {
  onSubmit: (payload: LostItemFormData | { id: string; data: Partial<LostItemFormData>; photo?: File }) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<LostItemFormData & { id: string }>;
}

const categories: { value: ItemCategory; label: string; emoji: string }[] = [
  { value: 'eletrônico',     label: 'Eletrônico',     emoji: '📱' },
  { value: 'documento',      label: 'Documento',      emoji: '📄' },
  { value: 'roupa',          label: 'Roupa',          emoji: '👕' },
  { value: 'acessório',      label: 'Acessório',      emoji: '💍' },
  { value: 'bagagem',        label: 'Bagagem',        emoji: '🧳' },
  { value: 'objeto_pessoal', label: 'Objeto Pessoal', emoji: '🎒' },
  { value: 'outro',          label: 'Outro',          emoji: '📦' },
];

const inputCls =
  'mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider';

export const LostItemForm: React.FC<LostItemFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<LostItemFormData>({
    category: initialData?.category || 'outro',
    description: initialData?.description || '',
    color: initialData?.color || '',
    foundDate: initialData?.foundDate || new Date(),
    foundLocation: initialData?.foundLocation || '',
    deliveredBy: initialData?.deliveredBy || '',
    deliveredByPhone: initialData?.deliveredByPhone || '',
    observations: initialData?.observations || '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photoURL || '');
  const [loading, setLoading] = useState(false);

  // Efeito para carregar a data corretamente no formato Date ao entrar em modo de edição
  useEffect(() => {
    if (initialData?.foundDate) {
      setFormData(prev => ({
        ...prev,
        foundDate: new Date(initialData.foundDate as Date)
      }));
    }
  }, [initialData?.foundDate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ✅ VERIFICAÇÃO E CORREÇÃO DO SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulário:', {
      hasPhoto: !!photo,
      photoName: photo?.name
    });

    setLoading(true);
    try {
      if (initialData?.id) {
        // Modo de Edição
        // Montamos o objeto garantindo que a foto esteja no campo 'photo'
        const payload = {
          id: initialData.id,
          data: formData,
          photo: photo || undefined // 🆕 Garante que a nova foto (se houver) seja enviada no payload
        };
        
        await onSubmit(payload);
      } else {
        // Modo de Criação
        const payload = { 
          ...formData, 
          photo: photo || undefined 
        };
        await onSubmit(payload);
      }
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Linha 1: Categoria + Cor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Categoria *</label>
          <select name="category" value={formData.category} onChange={handleChange} required className={inputCls}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Cor</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Ex: Azul, Preto..."
            className={inputCls}
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className={labelCls}>Descrição *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Descreva o item em detalhes..."
          className={inputCls}
        />
      </div>

      {/* Linha 2: Data + Local */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Data encontrado *</label>
          <input
            type="date"
            value={formData.foundDate instanceof Date
              ? formData.foundDate.toISOString().split('T')[0]
              : ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, foundDate: new Date(e.target.value) }))
            }
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Local encontrado *</label>
          <input
            type="text"
            name="foundLocation"
            value={formData.foundLocation}
            onChange={handleChange}
            required
            placeholder="Ex: Recepção, Quarto 101..."
            className={inputCls}
          />
        </div>
      </div>

      {/* Linha 3: Quem entregou + Telefone */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nome de quem entregou *</label>
          <input
            type="text"
            name="deliveredBy"
            value={formData.deliveredBy}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Telefone (opcional)</label>
          <input
            type="tel"
            name="deliveredByPhone"
            value={formData.deliveredByPhone}
            onChange={handleChange}
            placeholder="(99) 99999-9999"
            className={inputCls}
          />
        </div>
      </div>

      {/* Foto */}
      <div>
        <label className={labelCls}>Foto do objeto</label>
        <div className="mt-1 flex items-start gap-4">
          <label className="cursor-pointer flex-1">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">📷</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {photo ? photo.name : 'Clique para selecionar uma foto'}
              </p>
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
          {photoPreview && (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className={labelCls}>Observações</label>
        <textarea
          name="observations"
          value={formData.observations}
          onChange={handleChange}
          rows={2}
          placeholder="Anotações adicionais..."
          className={inputCls}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-blue-600/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </span>
          ) : (
            '✓ Salvar Item'
          )}
        </button>
      </div>
    </form>
  );
};