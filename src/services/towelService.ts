// src/services/towelService.ts - USANDO CONFIG DO FIREBASE
import { db, auth } from './firebase';
import { 
  doc, setDoc, getDoc, deleteDoc, collection, 
  query, where, getDocs, writeBatch, addDoc 
} from 'firebase/firestore';
import type { TowelSignature } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Pegar configuração do Firebase já inicializado
function getFirebaseConfig() {
  const app = (db as any).app;
  return {
    apiKey: app.options.apiKey,
    projectId: app.options.projectId
  };
}

// Gerar token
export async function generateTowelToken(
  aptNumber: number,
  guestName: string,
  operation: TowelSignature['operation'],
  quantity: number
): Promise<{ token: string; url: string }> {
  const token = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60000);

  const signatureData: TowelSignature = {
    aptNumber,
    guestName,
    token,
    operation,
    quantity,
    signature: '',
    signedAt: '',
    expiresAt: expiresAt.toISOString(),
    used: false
  };

  await setDoc(
    doc(db, 'apartments', String(aptNumber), 'towelSignatures', token), 
    signatureData
  );

  const url = `/toalha/${aptNumber}/${token}`;
  return { token, url };
}

// Validar token
export async function validateToken(aptNumber: number, token: string): Promise<TowelSignature | null> {
  try {
    const docRef = doc(db, 'apartments', String(aptNumber), 'towelSignatures', token);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;

    const data = docSnap.data() as TowelSignature;
    
    if (new Date(data.expiresAt) < new Date()) {
      await deleteDoc(docRef);
      return null;
    }
    
    if (data.used) return null;
    
    return { ...data, id: docSnap.id };
    
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return null;
  }
}

// Salvar assinatura usando REST API
export async function saveSignature(
  aptNumber: number,
  token: string, 
  signatureBase64: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenData = await validateToken(aptNumber, token);
    if (!tokenData) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    // 🆕 Pegar config do Firebase já inicializado
    const config = getFirebaseConfig();
    const { apiKey, projectId } = config;
    
    console.log('🔑 Usando API Key:', apiKey ? 'OK' : 'Faltando');
    console.log('📦 Project ID:', projectId);

    if (!apiKey || !projectId) {
      return { success: false, error: 'Configuração do Firebase incompleta' };
    }

    // Salvar assinatura via REST
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apartments/${aptNumber}/towelSignatures/${token}?updateMask.fieldPaths=signature&updateMask.fieldPaths=signedAt&updateMask.fieldPaths=used&key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          signature: { stringValue: signatureBase64 },
          signedAt: { stringValue: new Date().toISOString() },
          used: { booleanValue: true }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro REST:', errorData);
      return { success: false, error: 'Erro ao salvar assinatura' };
    }

    // Registrar no log usando SDK mesmo (se falhar, não impede)
    try {
      await addDoc(collection(db, 'log'), {
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('pt-BR'),
        apt: aptNumber,
        msg: tokenData.operation === 'chips_to_towels' 
          ? `🧺 Assinatura: Retirada de ${tokenData.quantity} toalha(s) - ${tokenData.guestName}`
          : `🔄 Assinatura: Troca de ${tokenData.quantity} toalha(s) - ${tokenData.guestName}`,
        type: 'towel',
        ts: Date.now(),
        userId: 'guest',
        userName: tokenData.guestName || 'Hóspede'
      });
    } catch (logError) {
      console.warn('Não foi possível registrar log:', logError);
    }

    return { success: true };
    
  } catch (error: any) {
    console.error('Erro ao salvar assinatura:', error);
    return { success: false, error: error.message };
  }
}

// Buscar assinatura ativa
export async function getActiveSignature(aptNumber: number): Promise<TowelSignature | null> {
  const colRef = collection(db, 'apartments', String(aptNumber), 'towelSignatures');
  const q = query(colRef, where('used', '==', true));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TowelSignature));
  docs.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());
  
  return docs[0];
}

// Limpar assinaturas no checkout
export async function clearSignaturesOnCheckout(aptNumber: number): Promise<void> {
  const colRef = collection(db, 'apartments', String(aptNumber), 'towelSignatures');
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  
  snapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, {
      signature: '',
      clearedAt: new Date().toISOString(),
      wasCleared: true
    });
  });
  
  await batch.commit();
  
  const currentUser = auth.currentUser;
  await addDoc(collection(db, 'log'), {
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('pt-BR'),
    apt: aptNumber,
    msg: `🗑️ ${snapshot.docs.length} assinatura(s) de toalhas limpas no checkout`,
    type: 'checkout',
    ts: Date.now(),
    userId: currentUser?.uid || 'sistema',
    userName: currentUser?.displayName || 'Sistema'
  });
}

// Buscar assinaturas
export async function getSignatureHistory(aptNumber: number): Promise<TowelSignature[]> {
  const colRef = collection(db, 'apartments', String(aptNumber), 'towelSignatures');
  const q = query(colRef, where('used', '==', true));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TowelSignature));
}