// src/services/lostAndFoundService.ts
import { db, storage } from './firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import type { LostItem, LostItemFormData, LostItemFilters } from '../types/lostAndFound.types';

const COLLECTION_NAME = 'lostItems';

// Gerar código único
export const generateUniqueCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const yearShort = year.toString().slice(-2);
  
  const q = query(
    collection(db, COLLECTION_NAME),
    where('uniqueCode', '>=', `ACH-${yearShort}`),
    where('uniqueCode', '<=', `ACH-${yearShort}\uf8ff`),
    orderBy('uniqueCode', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  let lastNumber = 0;
  
  if (!snapshot.empty) {
    const lastCode = snapshot.docs[0].data().uniqueCode;
    const match = lastCode.match(/ACH-\d{2}-(\d+)/);
    if (match) {
      lastNumber = parseInt(match[1]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(5, '0');
  return `ACH-${yearShort}-${newNumber}`;
};

// Upload de múltiplas fotos (Mantido para compatibilidade, embora update use foto única agora)
export const uploadItemPhotos = async (itemId: string, files: File[]): Promise<string[]> => {
  console.log(`📤 Iniciando upload de ${files.length} fotos...`);
  
  const uploadPromises = files.map(async (file, index) => {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `photo_${timestamp}_${index}.${fileExtension}`;
    const photoRef = ref(storage, `lostAndFound/${itemId}/${fileName}`);
    
    const metadata = {
      contentType: file.type,
      cacheControl: 'no-cache, no-store, must-revalidate',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        itemId: itemId,
        index: index.toString()
      }
    };
    
    await uploadBytes(photoRef, file, metadata);
    const downloadURL = await getDownloadURL(photoRef);
    
    console.log(`✅ Foto ${index + 1} enviada:`, downloadURL);
    return downloadURL;
  });
  
  return await Promise.all(uploadPromises);
};

// Upload de foto única (legado)
export const uploadItemPhoto = async (itemId: string, file: File): Promise<string> => {
  const urls = await uploadItemPhotos(itemId, [file]);
  return urls[0];
};

// Deletar todas as fotos de um item
export const deleteItemPhotos = async (itemId: string): Promise<void> => {
  try {
    const folderRef = ref(storage, `lostAndFound/${itemId}`);
    const listResult = await listAll(folderRef);
    
    for (const item of listResult.items) {
      await deleteObject(item);
      console.log('🗑️ Deletado:', item.fullPath);
    }
  } catch (error: any) {
    console.log('ℹ️ Nenhuma foto para deletar ou erro:', error.code);
  }
};

// Deletar uma foto específica
export const deleteSinglePhoto = async (photoURL: string): Promise<void> => {
  try {
    const photoRef = ref(storage, photoURL);
    await deleteObject(photoRef);
    console.log('🗑️ Foto deletada:', photoURL);
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    throw error;
  }
};

// Criar item com suporte a múltiplas fotos
export const createLostItem = async (
  data: LostItemFormData, 
  userId: string
): Promise<LostItem> => {
  const uniqueCode = await generateUniqueCode();
  
  const itemData: any = {
    uniqueCode,
    category: data.category,
    description: data.description,
    color: data.color,
    foundDate: Timestamp.fromDate(data.foundDate),
    foundLocation: data.foundLocation,
    deliveredBy: data.deliveredBy,
    deliveredByPhone: data.deliveredByPhone,
    status: 'guardado',
    createdAt: Timestamp.fromDate(new Date()),
    createdBy: userId,
    updatedAt: Timestamp.fromDate(new Date()),
    observations: data.observations
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), itemData);
  
  // Upload de múltiplas fotos
  let photos: string[] = [];
  let photoURL: string | undefined;
  
  // Verifica se veio array ou arquivo único
  const filesToUpload = data.photos || (data.photo ? [data.photo] : []);
  
  if (filesToUpload.length > 0) {
    photos = await uploadItemPhotos(docRef.id, filesToUpload);
    photoURL = photos[0]; // Primeira foto como principal
    
    await updateDoc(docRef, { photos, photoURL });
  }
  
  return {
    id: docRef.id,
    ...itemData,
    foundDate: data.foundDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    photos,
    photoURL
  } as LostItem;
};

// ✅ FUNÇÃO ATUALIZADA (Foto Única)
export const updateLostItem = async (
  id: string, 
  data: Partial<Omit<LostItem, 'id' | 'photoURL' | 'photos'>>,
  newPhoto?: File
): Promise<void> => {
  console.log('📝 ATUALIZANDO ITEM:', id);
  
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: any = {};
  
  // 🆕 REMOVER qualquer campo de arquivo residual
  delete (data as any).photo;
  delete (data as any).photos;
  delete (data as any).photoURL;
  
  // Processar outros dados textuais
  if (data && Object.keys(data).length > 0) {
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
  }
  
  // Sempre atualizar o timestamp
  updateData.updatedAt = Timestamp.fromDate(new Date());
  
  // Converter datas
  if (updateData.foundDate instanceof Date) {
    updateData.foundDate = Timestamp.fromDate(updateData.foundDate);
  }
  if (updateData.returnedDate instanceof Date) {
    updateData.returnedDate = Timestamp.fromDate(updateData.returnedDate);
  }
  
  // Salvar dados textuais PRIMEIRO
  if (Object.keys(updateData).length > 0) {
    console.log('💾 Salvando no Firestore:', updateData);
    await updateDoc(docRef, updateData);
  }
  
  // DEPOIS processar a foto (se existir)
  if (newPhoto) {
    console.log('📸 Processando nova foto...');
    
    try {
      // Deletar foto antiga (tenta deletar o caminho específico 'photo', se existir)
      try {
        const oldPhotoRef = ref(storage, `lostAndFound/${id}/photo`);
        await deleteObject(oldPhotoRef);
      } catch (error: any) {
        if (error.code !== 'storage/object-not-found') {
          console.warn('⚠️ Erro ao deletar foto antiga:', error.code);
        }
      }
      
      // Upload da nova foto
      const timestamp = Date.now();
      const fileExtension = newPhoto.name.split('.').pop();
      const fileName = `photo_${timestamp}.${fileExtension}`;
      const photoRef = ref(storage, `lostAndFound/${id}/${fileName}`);
      
      await uploadBytes(photoRef, newPhoto);
      const newPhotoURL = await getDownloadURL(photoRef);
      
      // Atualizar APENAS o campo photoURL
      await updateDoc(docRef, { 
        photoURL: newPhotoURL,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log('✅ Foto atualizada:', newPhotoURL);
    } catch (error) {
      console.error('❌ Erro ao processar foto:', error);
      throw error;
    }
  }
  
  console.log('✅ Item atualizado com sucesso');
};

// Deletar item
export const deleteLostItem = async (id: string): Promise<void> => {
  // Deletar todas as fotos da pasta
  await deleteItemPhotos(id);
  
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// Buscar item por ID
export const getLostItem = async (id: string): Promise<LostItem | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docRef.id,
    uniqueCode: data.uniqueCode,
    category: data.category,
    description: data.description,
    color: data.color,
    foundDate: data.foundDate.toDate(),
    foundLocation: data.foundLocation,
    deliveredBy: data.deliveredBy,
    deliveredByPhone: data.deliveredByPhone,
    photoURL: data.photoURL,
    photos: data.photos || [],
    status: data.status,
    returnedTo: data.returnedTo,
    returnedDate: data.returnedDate?.toDate(),
    observations: data.observations,
    createdAt: data.createdAt.toDate(),
    createdBy: data.createdBy,
    updatedAt: data.updatedAt.toDate()
  };
};

// Listar itens com filtros
export const getLostItems = async (filters?: LostItemFilters): Promise<LostItem[]> => {
  console.log('🔍 Buscando itens com filtros:', filters);
  
  const constraints: QueryConstraint[] = [];
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  
  if (filters?.startDate) {
    constraints.push(where('foundDate', '>=', Timestamp.fromDate(filters.startDate)));
  }
  
  if (filters?.endDate) {
    constraints.push(where('foundDate', '<=', Timestamp.fromDate(filters.endDate)));
  }
  
  const q = query(collection(db, COLLECTION_NAME), ...constraints);
  const snapshot = await getDocs(q);
  
  console.log(`📊 Documentos encontrados: ${snapshot.size}`);
  
  let items = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      uniqueCode: data.uniqueCode,
      category: data.category,
      description: data.description,
      color: data.color,
      foundDate: data.foundDate.toDate(),
      foundLocation: data.foundLocation,
      deliveredBy: data.deliveredBy,
      deliveredByPhone: data.deliveredByPhone,
      photoURL: data.photoURL,
      photos: data.photos || [],
      status: data.status,
      returnedTo: data.returnedTo,
      returnedDate: data.returnedDate?.toDate(),
      observations: data.observations,
      createdAt: data.createdAt.toDate(),
      createdBy: data.createdBy,
      updatedAt: data.updatedAt.toDate()
    };
  });
  
  // Filtro de busca por texto (client-side)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    items = items.filter(item => 
      item.uniqueCode.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.deliveredBy.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower)
    );
  }
  
  console.log(`✅ Retornando ${items.length} itens`);
  return items;
};

// Marcar como entregue
export const markAsReturned = async (
  id: string, 
  returnedTo: string
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status: 'entregue',
    returnedTo,
    returnedDate: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// Marcar como descartado
export const markAsDiscarded = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status: 'descartado',
    updatedAt: Timestamp.fromDate(new Date())
  });
};