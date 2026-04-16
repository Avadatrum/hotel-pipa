// src/services/storageService.ts
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const storage = getStorage();

export const storageService = {
  /**
   * Upload de foto para um passeio
   */
  async uploadTourPhoto(tourId: string, file: File): Promise<string> {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `tours/${tourId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Atualizar o documento do tour com a URL da foto
    const tourRef = doc(db, 'tours', tourId);
    await updateDoc(tourRef, {
      fotos: arrayUnion(downloadURL)
    });
    
    return downloadURL;
  },

  /**
   * Deletar foto de um passeio
   */
  async deleteTourPhoto(tourId: string, photoURL: string): Promise<void> {
    // Extrair o path da URL
    const path = this.extractPathFromURL(photoURL);
    if (path) {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    }
    
    // Remover do array de fotos
    const tourRef = doc(db, 'tours', tourId);
    await updateDoc(tourRef, {
      fotos: arrayRemove(photoURL)
    });
  },

  /**
   * Extrai o path do Storage de uma URL
   */
  extractPathFromURL(url: string): string | null {
    try {
      const decodedUrl = decodeURIComponent(url);
      const match = decodedUrl.match(/\/o\/(.+?)\?/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Upload múltiplo de fotos
   */
  async uploadMultiplePhotos(tourId: string, files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.uploadTourPhoto(tourId, file);
      urls.push(url);
    }
    return urls;
  }
};