// src/types/guestGuide.types.ts

export type GuideLanguage = 'pt' | 'es' | 'en';

export interface GuestGuideContent {
  wifi: {
    network: string;
    password: string;
  };
  schedules: {
    breakfast: string;      // Ex: "8h às 10h30"
    afternoonTea: string;   // Ex: "16h às 17h"
    pool: string;           // Ex: "8h às 20h"
    checkout: string;       // Ex: "12h"
    restaurant: string;     // Ex: "12h às 20h (cozinha fecha 19h)"
  };
  contacts: {
    reception: string;      // Ex: "+55 84 99999-9999"
    emergency: string;      // Ex: "190 / 192 / 193"
  };
  rules: string[];          // Cada item é uma regra (HTML permitido)
  beachInfo: string;        // HTML com informações das praias
  photos: string[];         // URLs das fotos do guia (não usaremos por enquanto)
}

export interface GuestGuideConfig {
  id: string; // sempre "default"
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