// src/components/lostAndFound/LostItemForm.tsx

import React, { useState, useEffect } from 'react';
import type { LostItemFormData, ItemCategory } from '../../types/lostAndFound.types';

// Altere a interface para:
interface LostItemFormProps {
  onSubmit: (data: LostItemFormData & { photo?: File; photos?: File[] }) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<LostItemFormData> & { id?: string; photoURL?: string; photos?: string[] };
  loading?: boolean;
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

export const LostItemForm: React.FC<LostItemFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  loading = false 
}) => {
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

  // 🆕 Estados para múltiplas fotos
  const [newPhotos, setNewPhotos] = useState<File[]>([]); 
  
  // CORREÇÃO TypeScript: .filter(Boolean) garante que o tipo seja string[] removendo undefined
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    (initialData?.photos && initialData.photos.length > 0) 
      ? initialData.photos 
      : (initialData?.photoURL ? [initialData.photoURL] : [])
  );

  // Efeito para carregar a data corretamente no formato Date ao entrar em modo de edição
  useEffect(() => {
    if (initialData?.foundDate) {
      setFormData(prev => ({
        ...prev,
        foundDate: new Date(initialData.foundDate as Date)
      }));
    }
    // Atualiza as fotos existentes caso o initialData mude (ex: limpar formulário)
    if (initialData?.photos) {
      setExistingPhotos(initialData.photos);
    } else if (initialData?.photoURL) {
      setExistingPhotos([initialData.photoURL]);
    } else {
      setExistingPhotos([]);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🆕 Adicionar novas fotos
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewPhotos(prev => [...prev, ...files]);
    }
  };

  // 🆕 Remover uma nova foto selecionada (ainda não enviada)
  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepara o payload conforme a nova assinatura da interface:
      // onSubmit: (data: LostItemFormData & { photo?: File; photos?: File[] })
      const payload: LostItemFormData & { photos?: File[] } = {
        ...formData,
      };

      // Anexa as novas fotos se houver
      if (newPhotos.length > 0) {
        payload.photos = newPhotos;
      }

      // Nota: Como a nova interface não aceita 'photosToDelete' explícito, 
      // assumimos que o componente pai lida com a lógica de persistência das fotos antigas
      // ou que estamos apenas adicionando novas.
      
      console.log('📤 Enviando payload:', payload);
      await onSubmit(payload);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
      throw error;
    }
  };

  // Usa a prop 'loading' (controlada externamente) ou fallback para false
  const isSubmitting = loading || false;

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

      {/* 🆕 Múltiplas Fotos */}
      <div>
        <label className={labelCls}>Fotos do objeto</label>
        
        {/* Lista de fotos existentes (Visualização apenas) */}
        {existingPhotos.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Fotos atuais:</p>
            <div className="grid grid-cols-4 gap-2">
              {existingPhotos.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative group border-2 rounded-lg overflow-hidden border-slate-200 dark:border-slate-700">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de novas fotos */}
        {newPhotos.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-2">Novas fotos a serem enviadas:</p>
            <div className="grid grid-cols-4 gap-2">
              {newPhotos.map((file, idx) => (
                <div key={`new-${idx}`} className="relative group">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input para adicionar mais fotos */}
        <div className="mt-2">
          <label className="cursor-pointer block w-full">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 text-center transition-colors">
              <span className="text-2xl">📷</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Adicionar mais fotos...
              </p>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoChange} 
              className="hidden" 
            />
          </label>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Você pode selecionar várias fotos de uma vez.
        </p>
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
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-blue-600/20"
        >
          {isSubmitting ? (
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