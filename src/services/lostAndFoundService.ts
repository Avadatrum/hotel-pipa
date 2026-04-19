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

// Upload de foto
export const uploadItemPhoto = async (itemId: string, file: File): Promise<string> => {
  console.log('📤 Iniciando upload para:', `lostAndFound/${itemId}/photo`);
  
  try {
    // Usar timestamp no nome do arquivo para evitar cache
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `photo_${timestamp}.${fileExtension}`;
    
    const storageRef = ref(storage, `lostAndFound/${itemId}/${fileName}`);
    
    // Metadados para evitar cache
    const metadata = {
      contentType: file.type,
      cacheControl: 'no-cache, no-store, must-revalidate',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        itemId: itemId,
        timestamp: timestamp.toString()
      }
    };
    
    console.log('📁 Fazendo upload:', storageRef.fullPath);
    
    // Upload
    await uploadBytes(storageRef, file, metadata);
    
    // Obter URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('📎 URL gerada:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('❌ Erro detalhado no upload:', error);
    throw error;
  }
};

// Criar item
export const createLostItem = async (
  data: LostItemFormData, 
  userId: string
): Promise<LostItem> => {
  const uniqueCode = await generateUniqueCode();
  let photoURL = undefined;
  
  const itemData: Omit<LostItem, 'id'> = {
    uniqueCode,
    category: data.category,
    description: data.description,
    color: data.color,
    foundDate: data.foundDate,
    foundLocation: data.foundLocation,
    deliveredBy: data.deliveredBy,
    deliveredByPhone: data.deliveredByPhone,
    status: 'guardado',
    createdAt: new Date(),
    createdBy: userId,
    updatedAt: new Date(),
    observations: data.observations
  };
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...itemData,
    foundDate: Timestamp.fromDate(data.foundDate),
    createdAt: Timestamp.fromDate(itemData.createdAt),
    updatedAt: Timestamp.fromDate(itemData.updatedAt)
  });
  
  if (data.photo) {
    photoURL = await uploadItemPhoto(docRef.id, data.photo);
    await updateDoc(docRef, { photoURL });
  }
  
  return {
    id: docRef.id,
    ...itemData,
    photoURL,
    foundDate: data.foundDate,
    createdAt: itemData.createdAt,
    updatedAt: itemData.updatedAt
  };
};

// ✅ FUNÇÃO CORRIGIDA: Salvar sempre que houver foto nova
export const updateLostItem = async (
  id: string, 
  data: Partial<Omit<LostItem, 'id' | 'photoURL' | 'photo'>>,
  newPhoto?: File
): Promise<void> => {
  console.log('📝 ATUALIZANDO ITEM:', id);
  console.log('📸 Tem nova foto?', !!newPhoto);
  
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: any = {};
  
  // 🆕 PRIMEIRO: Processar a nova foto (se existir)
  if (newPhoto) {
    console.log('📤 Processando nova foto...');
    
    try {
      // 1. Deletar TODAS as fotos antigas da pasta
      try {
        const folderRef = ref(storage, `lostAndFound/${id}`);
        const listResult = await listAll(folderRef);
        
        // Deletar todos os arquivos na pasta
        for (const itemRef of listResult.items) {
          await deleteObject(itemRef);
          console.log('🗑️ Deletado:', itemRef.fullPath);
        }
      } catch (error: any) {
        // Se a pasta não existir ou erro de permissão, ignoramos e seguimos
        if (error.code !== 'storage/object-not-found') {
          console.warn('⚠️ Erro ao limpar fotos antigas:', error);
        } else {
          console.log('ℹ️ Nenhuma foto antiga para deletar');
        }
      }
      
      // 2. Upload da nova foto (usando função auxiliar ou lógica local)
      // Nota: Reutilizei a lógica interna aqui para garantir o controle exato dos metadados
      const timestamp = Date.now();
      const fileExtension = newPhoto.name.split('.').pop();
      const fileName = `photo_${timestamp}.${fileExtension}`;
      const photoRef = ref(storage, `lostAndFound/${id}/${fileName}`);
      
      const metadata = {
        contentType: newPhoto.type,
        cacheControl: 'no-cache, no-store, must-revalidate',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          timestamp: timestamp.toString()
        }
      };
      
      await uploadBytes(photoRef, newPhoto, metadata);
      const newPhotoURL = await getDownloadURL(photoRef);
      
      console.log('✅ Nova URL gerada:', newPhotoURL);
      
      // 3. 🆕 ADICIONAR a nova URL aos dados de atualização
      updateData.photoURL = newPhotoURL;
      
    } catch (error) {
      console.error('❌ Erro ao processar foto:', error);
      throw error;
    }
  }
  
  // SEGUNDO: Processar outros dados do formulário
  if (data && Object.keys(data).length > 0) {
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
  }
  
  // Sempre atualizar o timestamp
  updateData.updatedAt = Timestamp.fromDate(new Date());
  
  // Converter datas para Timestamp do Firestore
  if (updateData.foundDate instanceof Date) {
    updateData.foundDate = Timestamp.fromDate(updateData.foundDate);
  }
  if (updateData.returnedDate instanceof Date) {
    updateData.returnedDate = Timestamp.fromDate(updateData.returnedDate);
  }
  
  // TERCEIRO: Salvar TUDO no Firestore de uma única vez
  console.log('💾 Salvando no Firestore:', updateData);
  
  try {
    await updateDoc(docRef, updateData);
    console.log('✅ Documento atualizado com sucesso!');
    
    // (Opcional) Verificar se salvou corretamente (apenas para debug)
    const verifyDoc = await getDoc(docRef);
    console.log('🔍 Verificação - photoURL no Firestore:', verifyDoc.data()?.photoURL);
    
  } catch (error) {
    console.error('❌ Erro ao salvar no Firestore:', error);
    throw error;
  }
};

// Deletar item
export const deleteLostItem = async (id: string): Promise<void> => {
  // Deletar fotos se existirem (usando listAll pois o nome do arquivo varia)
  try {
    const folderRef = ref(storage, `lostAndFound/${id}`);
    const listResult = await listAll(folderRef);
    
    if (listResult.items.length > 0) {
      const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
      console.log(`🗑️ ${deletePromises.length} arquivo(s) de imagem deletado(s)`);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao deletar fotos (pode não existirem):', error);
  }
  
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// Buscar item por ID
export const getLostItem = async (id: string): Promise<LostItem | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    uniqueCode: data.uniqueCode,
    category: data.category,
    description: data.description,
    color: data.color,
    foundDate: data.foundDate.toDate(),
    foundLocation: data.foundLocation,
    deliveredBy: data.deliveredBy,
    deliveredByPhone: data.deliveredByPhone,
    photoURL: data.photoURL,
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