// src/components/commissions/TourGalleryManager.tsx
import { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar tipos de arquivo
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showToast('Apenas imagens são permitidas', 'warning');
      return;
    }

    // Validar tamanho (max 5MB por foto)
    const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      showToast('Cada foto deve ter no máximo 5MB', 'warning');
      return;
    }

    setUploading(true);
    try {
      await storageService.uploadMultiplePhotos(tour.id, files);
      showToast(`${files.length} foto(s) adicionada(s) com sucesso!`, 'success');
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
      showToast('Foto excluída com sucesso!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao excluir foto', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const fotos = tour.fotos || [];

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
              PNG, JPG até 5MB
            </p>
          </div>
        </label>
      </div>

      {/* Gallery Grid */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((photo, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => handleDelete(photo)}
                disabled={deleting === photo}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
              >
                {deleting === photo ? '⏳' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {fotos.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          Nenhuma foto cadastrada
        </p>
      )}
    </div>
  );
}