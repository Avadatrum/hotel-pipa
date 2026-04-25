// src/components/commissions/TourGalleryManager.tsx - ATUALIZADO
import { useState, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { storageService } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';
import type { Tour } from '../../types';

interface TourGalleryManagerProps {
  tour: Tour;
  onUpdate: () => void;
}

export function TourGalleryManager({ tour, onUpdate }: TourGalleryManagerProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fotos = tour.fotos || [];
  const coverPhoto = fotos[0]; // A primeira foto é a capa

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const auth = getAuth();
    if (!auth.currentUser) {
      showToast('Você precisa estar logado para fazer upload', 'error');
      return;
    }

    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showToast('Apenas imagens são permitidas', 'warning');
      return;
    }

    const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      showToast('Cada foto deve ter no máximo 5MB', 'warning');
      return;
    }

    setUploading(true);
    try {
      await storageService.uploadMultiplePhotos(tour.id, files);
      showToast(`${files.length} foto(s) adicionada(s)!`, 'success');
      onUpdate();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Erro no upload:', error);
      showToast('Erro ao fazer upload das fotos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoURL: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
    
    setDeleting(photoURL);
    try {
      await storageService.deleteTourPhoto(tour.id, photoURL);
      showToast('Foto excluída!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao excluir foto', 'error');
    } finally {
      setDeleting(null);
    }
  };

  // 🆕 Definir foto como capa (move para primeira posição)
  const handleSetCover = async (photoURL: string) => {
    if (photoURL === coverPhoto) {
      showToast('Esta foto já é a capa', 'info');
      return;
    }

    setSettingCover(true);
    try {
      // Remove a foto da posição atual
      const newFotos = fotos.filter(f => f !== photoURL);
      // Insere no início (posição de capa)
      newFotos.unshift(photoURL);

      // Atualiza no Firestore
      await updateDoc(doc(db, 'tours', tour.id), {
        fotos: newFotos,
        updatedAt: new Date()
      });

      showToast('📸 Foto definida como capa!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Erro ao definir capa:', error);
      showToast('Erro ao definir foto de capa', 'error');
    } finally {
      setSettingCover(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-2xl">📸</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploading ? 'Enviando...' : 'Clique para adicionar fotos'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG até 5MB • A primeira foto é a capa
            </p>
          </div>
        </label>
      </div>

      {/* Gallery Grid */}
      {fotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>🖼️ {fotos.length} foto(s)</span>
            <span className="mx-1">•</span>
            <span>⭐ A primeira foto é a capa do passeio</span>
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((photo, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={photo}
                  alt={index === 0 ? 'Foto de capa' : `Foto ${index + 1}`}
                  className={`w-full h-full object-cover rounded-lg ${
                    index === 0 ? 'ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-900' : ''
                  }`}
                />
                
                {/* Badge de capa */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                    ⭐ Capa
                  </div>
                )}
                
                {/* Overlay com botões */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {/* Botão Definir Capa */}
                  {index !== 0 && (
                    <button
                      onClick={() => handleSetCover(photo)}
                      disabled={settingCover}
                      className="w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center text-sm hover:bg-amber-500 transition-colors shadow-lg"
                      title="Definir como capa"
                    >
                      ⭐
                    </button>
                  )}
                  
                  {/* Botão Excluir */}
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={deleting === photo}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                    title="Excluir foto"
                  >
                    {deleting === photo ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fotos.length === 0 && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <span className="text-4xl mb-2 block">🖼️</span>
          <p className="text-gray-400 text-sm">
            Nenhuma foto cadastrada
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Adicione fotos para deixar o passeio mais atrativo
          </p>
        </div>
      )}
    </div>
  );
}