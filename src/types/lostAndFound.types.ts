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
  category: ItemCategory;
  description: string;
  color?: string;
  foundDate: Date;
  foundLocation: string;
  deliveredBy: string;
  deliveredByPhone?: string;
  photoURL?: string;
  status: ItemStatus;
  returnedTo?: string;
  returnedDate?: Date;
  observations?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface LostItemFormData {
  category: ItemCategory;
  description: string;
  color?: string;
  foundDate: Date;
  foundLocation: string;
  deliveredBy: string;
  deliveredByPhone?: string;
  photo?: File;
  photoURL?: string;
  observations?: string;
}

export interface LostItemFilters {
  search?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  startDate?: Date;
  endDate?: Date;
}