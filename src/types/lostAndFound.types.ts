// src/types/lostAndFound.types.ts

export type ItemCategory = 
  | 'eletrônico'
  | 'documento'
  | 'roupa'
  | 'acessório'
  | 'bagagem'
  | 'objeto_pessoal'
  | 'outro';

export type ItemStatus = 'guardado' | 'entregue' | 'descartado';

export interface LostItem {
  id: string;
  uniqueCode: string;
  category: 'eletrônico' | 'documento' | 'roupa' | 'acessório' | 'bagagem' | 'objeto_pessoal' | 'outro';
  description: string;
  color?: string;
  foundDate: Date;
  foundLocation: string;
  deliveredBy: string;
  deliveredByPhone?: string;
  photoURL?: string; // 🆕 Mantém compatibilidade com itens antigos (foto única)
  photos?: string[]; // 🆕 Array de URLs para múltiplas fotos
  status: 'guardado' | 'entregue' | 'descartado';
  returnedTo?: string;
  returnedDate?: Date;
  observations?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface LostItemFormData {
  category: LostItem['category'];
  description: string;
  color?: string;
  foundDate: Date;
  foundLocation: string;
  deliveredBy: string;
  deliveredByPhone?: string;
  photo?: File; // Foto única (compatibilidade)
  photos?: File[]; // 🆕 Múltiplas fotos (array de arquivos)
  observations?: string;
}

export interface LostItemFilters {
  search?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  startDate?: Date;
  endDate?: Date;
}