// src/types/guestGuide.types.ts

export type GuideLanguage = 'pt' | 'es' | 'en';

export interface GuestGuideContent {
  wifi: {
    network: string;
    password: string;
  };
  schedules: {
    breakfast: string;
    afternoonTea: string;
    pool: string;
    checkout: string;
    restaurant: string;
  };
  contacts: {
    reception: string;
    emergency: string;
  };
  rules: string[];
  beachInfo: string;
  photos: string[];
  // 🆕 Lugares recomendados
  places: GuidePlace[];
}

export interface GuestGuideConfig {
  id: string;
  content: Record<GuideLanguage, GuestGuideContent>;
  updatedAt: string;
  updatedBy: string;
}

export interface GuestToken {
  token: string;
  aptNumber: number;
  guestName: string;
  phone?: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

// 🆕 Tipo para lugares no mapa
export interface GuidePlace {
  id: string;
  name: Record<GuideLanguage, string>;
  description: Record<GuideLanguage, string>;
  category: 'beach' | 'restaurant' | 'bar' | 'shop' | 'attraction' | 'other';
  lat: number;
  lng: number;
  icon?: string; // emoji
  order: number;
}