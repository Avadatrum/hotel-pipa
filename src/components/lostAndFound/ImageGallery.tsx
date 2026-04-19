// src/components/lostAndFound/ImageGallery.tsx
import React, { useState } from 'react';
import { ItemImage } from './ItemImage';

interface ImageGalleryProps {
  photos?: string[];
  photoURL?: string;
  alt: string;
  editable?: boolean;
  onDeletePhoto?: (photoURL: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  photos, 
  photoURL, 
  alt, 
  editable = false,
  onDeletePhoto 
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Combinar photos e photoURL
  const allPhotos = photos || (photoURL ? [photoURL] : []);
  
  if (allPhotos.length === 0) {
    return (
      <div className="bg-slate-100 rounded-lg p-8 text-center">
        <span className="text-4xl mb-2 block">📷</span>
        <p className="text-slate-500">Nenhuma foto cadastrada</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Grid de miniaturas */}
      <div className="grid grid-cols-4 gap-2">
        {allPhotos.map((url, index) => (
          <div key={index} className="relative group">
            <div 
              className="cursor-pointer"
              onClick={() => setSelectedImage(url)}
            >
              <ItemImage 
                photoURL={url} 
                alt={`${alt} - foto ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg hover:opacity-80 transition"
              />
            </div>
            
            {editable && onDeletePhoto && (
              <button
                onClick={() => onDeletePhoto(url)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs"
                title="Remover foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Modal de visualização */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};