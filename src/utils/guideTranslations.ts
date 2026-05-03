// src/utils/guideTranslations.ts

import type { GuideLanguage } from '../types/guestGuide.types';

type TranslationKey = 
  // Loading
  | 'loading'
  // Error
  | 'error_title'
  | 'try_again'
  // Header
  | 'welcome'
  | 'apartment'
  | 'host_guide'
  // Guest Header
  | 'towels'
  | 'chips'
  // Sections
  | 'gastronomy'
  | 'room_info'
  | 'norms_rules'
  | 'beaches_nature'
  | 'services_leisure'
  | 'support'
  // Cards
  | 'restaurant'
  | 'full_menu'
  | 'minibar'
  | 'drinks_snacks'
  | 'wifi_title'
  | 'wifi_network'
  | 'wifi_password'
  | 'schedules_title'
  | 'breakfast'
  | 'afternoon_tea'
  | 'lunch_dinner'
  | 'pool'
  | 'checkout'
  | 'rules_title'
  | 'beach_info_title'
  | 'tours_title'
  | 'tours_subtitle'
  | 'tide_table_title'
  | 'reception_whatsapp'
  | 'emergency_title'
  // Footer
  | 'footer_location'
  // GuestHeader
  | 'hello_welcome'
  | 'suite';

const translations: Record<GuideLanguage, Record<TranslationKey, string>> = {
  pt: {
    loading: 'Preparando seu guia...',
    error_title: 'Ops!',
    try_again: 'Tentar novamente',
    welcome: 'Olá, seja bem-vindo(a)',
    apartment: 'Apto',
    host_guide: 'Guia do Hóspede',
    towels: 'Toalhas',
    chips: 'Fichas',
    gastronomy: 'Gastronomia',
    room_info: 'Informações do Quarto',
    norms_rules: 'Normas & Regulamento',
    beaches_nature: 'Praias & Natureza',
    services_leisure: 'Serviços & Lazer',
    support: 'Atendimento',
    restaurant: 'Restaurante',
    full_menu: 'Cardápio Completo',
    minibar: 'Frigobar',
    drinks_snacks: 'Bebidas e Snacks',
    wifi_title: 'Conexão Wi-Fi',
    wifi_network: 'Rede (SSID)',
    wifi_password: 'Senha',
    schedules_title: 'Horários',
    breakfast: 'Café da manhã',
    afternoon_tea: 'Chá da tarde',
    lunch_dinner: 'Almoço / Jantar',
    pool: 'Piscina',
    checkout: 'Check-out',
    rules_title: 'Regras do Hotel',
    beach_info_title: 'Informações das Praias',
    tours_title: 'Passeios e Experiências',
    tours_subtitle: 'Agende pela Recepção',
    tide_table_title: 'Tábua de Maré',
    reception_whatsapp: 'WhatsApp Recepção',
    emergency_title: 'Emergência',
    footer_location: 'Praia da Pipa • Rio Grande do Norte',
    hello_welcome: 'Olá, seja bem-vindo(a)',
    suite: 'Apto'
  },
  es: {
    loading: 'Preparando su guía...',
    error_title: '¡Ups!',
    try_again: 'Intentar de nuevo',
    welcome: 'Hola, bienvenido(a)',
    apartment: 'Apto',
    host_guide: 'Guía del Huésped',
    towels: 'Toallas',
    chips: 'Fichas',
    gastronomy: 'Gastronomía',
    room_info: 'Información de la Habitación',
    norms_rules: 'Normas y Reglamento',
    beaches_nature: 'Playas y Naturaleza',
    services_leisure: 'Servicios y Ocio',
    support: 'Atención',
    restaurant: 'Restaurante',
    full_menu: 'Menú Completo',
    minibar: 'Minibar',
    drinks_snacks: 'Bebidas y Snacks',
    wifi_title: 'Conexión Wi-Fi',
    wifi_network: 'Red (SSID)',
    wifi_password: 'Contraseña',
    schedules_title: 'Horarios',
    breakfast: 'Desayuno',
    afternoon_tea: 'Té de la tarde',
    lunch_dinner: 'Almuerzo / Cena',
    pool: 'Piscina',
    checkout: 'Check-out',
    rules_title: 'Reglas del Hotel',
    beach_info_title: 'Información de las Playas',
    tours_title: 'Paseos y Experiencias',
    tours_subtitle: 'Reserve en Recepción',
    tide_table_title: 'Tabla de Mareas',
    reception_whatsapp: 'WhatsApp Recepción',
    emergency_title: 'Emergencia',
    footer_location: 'Praia da Pipa • Rio Grande do Norte',
    hello_welcome: 'Hola, bienvenido(a)',
    suite: 'Apto'
  },
  en: {
    loading: 'Preparing your guide...',
    error_title: 'Oops!',
    try_again: 'Try again',
    welcome: 'Hello, welcome',
    apartment: 'Apt',
    host_guide: 'Guest Guide',
    towels: 'Towels',
    chips: 'Chips',
    gastronomy: 'Gastronomy',
    room_info: 'Room Information',
    norms_rules: 'Rules & Regulations',
    beaches_nature: 'Beaches & Nature',
    services_leisure: 'Services & Leisure',
    support: 'Support',
    restaurant: 'Restaurant',
    full_menu: 'Full Menu',
    minibar: 'Minibar',
    drinks_snacks: 'Drinks & Snacks',
    wifi_title: 'Wi-Fi Connection',
    wifi_network: 'Network (SSID)',
    wifi_password: 'Password',
    schedules_title: 'Schedules',
    breakfast: 'Breakfast',
    afternoon_tea: 'Afternoon Tea',
    lunch_dinner: 'Lunch / Dinner',
    pool: 'Pool',
    checkout: 'Check-out',
    rules_title: 'Hotel Rules',
    beach_info_title: 'Beach Information',
    tours_title: 'Tours & Experiences',
    tours_subtitle: 'Book at Reception',
    tide_table_title: 'Tide Table',
    reception_whatsapp: 'WhatsApp Reception',
    emergency_title: 'Emergency',
    footer_location: 'Praia da Pipa • Rio Grande do Norte',
    hello_welcome: 'Hello, welcome',
    suite: 'Apt'
  }
};

export function useTranslation(language: GuideLanguage) {
  const t = (key: string): string => {
    const tk = key as TranslationKey;
    return translations[language]?.[tk] || translations['pt'][tk] || key;
  };

  return { t };
}