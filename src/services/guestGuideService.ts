// src/services/guestGuideService.ts

import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { GuestGuideConfig, GuestGuideContent, GuideLanguage, GuestToken, GuidePlace } from '../types/guestGuide.types';

// Coleções no Firestore
const TOKENS_COLLECTION = 'guestTokens';
const GUIDE_CONFIG_DOC = 'config/guestGuide';

// ============================================================
// CONFIGURAÇÕES DO GUIA (Admin)
// ============================================================

// Lugares padrão
const DEFAULT_PLACES: GuidePlace[] = [
  {
    id: 'praia-pipa',
    name: { pt: 'Praia da Pipa', es: 'Playa de Pipa', en: 'Pipa Beach' },
    description: { 
      pt: 'A praia principal, com falésias e piscinas naturais. Perfeita para surf e banho de mar.', 
      es: 'La playa principal, con acantilados y piscinas naturales. Perfecta para surf y baño.', 
      en: 'The main beach, with cliffs and natural pools. Perfect for surfing and swimming.' 
    },
    category: 'beach',
    lat: -6.2295,
    lng: -35.0486,
    icon: '🏖️',
    order: 1
  },
  {
    id: 'praia-amor',
    name: { pt: 'Praia do Amor', es: 'Playa del Amor', en: 'Love Beach' },
    description: { 
      pt: 'Famosa pelo formato de coração vista do mirante. Ótima para fotos e surf.', 
      es: 'Famosa por su forma de corazón vista desde el mirador. Ideal para fotos y surf.', 
      en: 'Famous for its heart shape seen from the viewpoint. Great for photos and surfing.' 
    },
    category: 'beach',
    lat: -6.2220,
    lng: -35.0460,
    icon: '❤️',
    order: 2
  },
  {
    id: 'restaurante-pipa',
    name: { pt: 'Restaurante Exemplo', es: 'Restaurante Ejemplo', en: 'Example Restaurant' },
    description: { 
      pt: 'Gastronomia local com frutos do mar frescos e vista para o mar.', 
      es: 'Gastronomía local con mariscos frescos y vista al mar.', 
      en: 'Local cuisine with fresh seafood and ocean view.' 
    },
    category: 'restaurant',
    lat: -6.2310,
    lng: -35.0500,
    icon: '🍽️',
    order: 3
  }
];

// Conteúdo padrão (fallback se não existir no Firestore)
const DEFAULT_CONTENT: Record<GuideLanguage, GuestGuideContent> = {
  pt: {
    wifi: { network: 'Hotel da Pipa', password: 'paraiso20' },
    schedules: {
      breakfast: '8h às 10h30',
      afternoonTea: '16h às 17h',
      pool: '8h às 20h',
      checkout: '12h',
      restaurant: '12h às 20h (cozinha fecha às 19h)'
    },
    contacts: {
      reception: '+55 (84) 99999-9999',
      emergency: '190 (Polícia) / 192 (SAMU) / 193 (Bombeiros)'
    },
    rules: [
      '<p>Disponibilizamos <strong>1 toalha de piscina por hóspede</strong>, por diária. Toalhas extras possuem custo adicional.</p>',
      '<p>Não é permitida a entrada de <strong>alimentos e bebidas externos</strong> nas áreas da piscina e restaurante.</p>',
      '<p>Não é permitido o uso de <strong>som externo</strong>. Respeite o silêncio após as <strong>22h</strong>.</p>',
      '<p>Acesso aos apartamentos é <strong>exclusivo para hóspedes</strong>. Visitantes devem consultar a recepção.</p>',
      '<p>Check-out até às <strong>12h</strong>. Danos ou extravios serão cobrados no check-out.</p>'
    ],
    beachInfo: '<p>A Praia da Pipa é conhecida por suas falésias, águas mornas e piscinas naturais. Confira a <strong>Tábua de Maré</strong> para melhores horários.</p>',
    photos: [],
    places: DEFAULT_PLACES
  },
  es: {
    wifi: { network: 'Hotel da Pipa', password: 'paraiso20' },
    schedules: {
      breakfast: '8h a 10h30',
      afternoonTea: '16h a 17h',
      pool: '8h a 20h',
      checkout: '12h',
      restaurant: '12h a 20h (cocina cierra 19h)'
    },
    contacts: {
      reception: '+55 (84) 99999-9999',
      emergency: '190 (Policía) / 192 (Ambulancia) / 193 (Bomberos)'
    },
    rules: [
      '<p>Disponemos de <strong>1 toalla de piscina por huésped</strong>, por día. Toallas adicionales tienen costo extra.</p>',
      '<p>No se permite la entrada de <strong>alimentos y bebidas externos</strong> en las áreas de piscina y restaurante.</p>',
      '<p>No se permite el uso de <strong>sonido externo</strong>. Respete el silencio después de las <strong>22h</strong>.</p>',
      '<p>El acceso a los apartamentos es <strong>exclusivo para huéspedes</strong>. Visitantes deben consultar recepción.</p>',
      '<p>Check-out hasta las <strong>12h</strong>. Daños o extravíos serán cobrados en el check-out.</p>'
    ],
    beachInfo: '<p>Praia da Pipa es conocida por sus acantilados, aguas cálidas y piscinas naturales. Consulte la <strong>Tabla de Mareas</strong> para conocer los mejores horarios.</p>',
    photos: [],
    places: DEFAULT_PLACES
  },
  en: {
    wifi: { network: 'Hotel da Pipa', password: 'paraiso20' },
    schedules: {
      breakfast: '8am to 10:30am',
      afternoonTea: '4pm to 5pm',
      pool: '8am to 8pm',
      checkout: '12pm',
      restaurant: '12pm to 8pm (kitchen closes 7pm)'
    },
    contacts: {
      reception: '+55 (84) 99999-9999',
      emergency: '190 (Police) / 192 (Ambulance) / 193 (Fire Dept.)'
    },
    rules: [
      '<p>We provide <strong>1 pool towel per guest</strong>, per day. Extra towels have an additional cost.</p>',
      '<p><strong>Outside food and drinks</strong> are not allowed in the pool and restaurant areas.</p>',
      '<p><strong>External speakers</strong> are not allowed. Please respect quiet hours after <strong>10pm</strong>.</p>',
      '<p>Access to apartments is <strong>exclusively for guests</strong>. Visitors must check with reception.</p>',
      '<p>Check-out is until <strong>12pm</strong>. Damages or lost items will be charged at check-out.</p>'
    ],
    beachInfo: '<p>Praia da Pipa is known for its cliffs, warm waters, and natural pools. Check the <strong>Tide Table</strong> for the best times.</p>',
    photos: [],
    places: DEFAULT_PLACES
  }
};

// Buscar configuração do guia (com fallback)
export async function getGuideConfig(): Promise<GuestGuideConfig> {
  try {
    const docRef = doc(db, GUIDE_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as GuestGuideConfig;
      return mergeWithDefaults(data);
    }

    return {
      id: 'default',
      content: DEFAULT_CONTENT,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  } catch (error) {
    console.error(`Erro ao buscar configuração do guia: ${error}`);
    return {
      id: 'default',
      content: DEFAULT_CONTENT,
      updatedAt: new Date().toISOString(),
      updatedBy: 'fallback'
    };
  }
}

// Salvar configuração do guia (admin)
export async function saveGuideConfig(config: GuestGuideConfig): Promise<void> {
  const docRef = doc(db, GUIDE_CONFIG_DOC);
  await setDoc(docRef, {
    ...config,
    updatedAt: new Date().toISOString()
  });
}

// Mescla configuração salva com defaults
function mergeWithDefaults(saved: GuestGuideConfig): GuestGuideConfig {
  const merged = { ...saved };
  
  (Object.keys(DEFAULT_CONTENT) as GuideLanguage[]).forEach(lang => {
    if (!merged.content[lang]) {
      merged.content[lang] = DEFAULT_CONTENT[lang];
    } else {
      // Garante que places existe em cada idioma
      if (!merged.content[lang].places || merged.content[lang].places.length === 0) {
        merged.content[lang].places = DEFAULT_PLACES;
      }
    }
  });

  return merged;
}

// ============================================================
// TOKENS DOS HÓSPEDES
// ============================================================

export async function generateGuestToken(
  aptNumber: number,
  guestName: string,
  phone?: string
): Promise<{ token: string; url: string }> {
  const token = uuidv4().slice(0, 8);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const tokenData: GuestToken = {
    token,
    aptNumber,
    guestName,
    phone: phone || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true
  };

  await setDoc(doc(db, TOKENS_COLLECTION, token), tokenData);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/guia/${aptNumber}/${token}`;
  
  return { token, url };
}

export async function validateGuestToken(
  aptNumber: number,
  token: string
): Promise<GuestToken | null> {
  try {
    const docRef = doc(db, TOKENS_COLLECTION, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as GuestToken;

    if (!data.active) return null;
    if (new Date() > new Date(data.expiresAt)) return null;
    if (data.aptNumber !== aptNumber) return null;

    return data;
  } catch (error) {
    console.error(`Erro ao validar token: ${error}`);
    return null;
  }
}

export async function getActiveTokenForApt(aptNumber: number): Promise<GuestToken | null> {
  try {
    const q = query(
      collection(db, TOKENS_COLLECTION),
      where('aptNumber', '==', aptNumber),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const docs = snapshot.docs.map(d => ({ ...d.data(), token: d.id } as GuestToken));
    docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return docs[0];
  } catch (error) {
    console.error(`Erro ao buscar token ativo: ${error}`);
    return null;
  }
}

export async function invalidateGuestToken(token: string): Promise<void> {
  try {
    const docRef = doc(db, TOKENS_COLLECTION, token);
    await updateDoc(docRef, { active: false });
  } catch (error) {
    console.error(`Erro ao invalidar token: ${error}`);
  }
}

export async function invalidateAllTokensForApt(aptNumber: number): Promise<void> {
  try {
    const q = query(
      collection(db, TOKENS_COLLECTION),
      where('aptNumber', '==', aptNumber),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { active: false });
    });
    
    await batch.commit();
    console.log(`🗑️ ${snapshot.docs.length} token(s) invalidados para o apt ${aptNumber}`);
  } catch (error) {
    console.error(`Erro ao invalidar tokens: ${error}`);
  }
}