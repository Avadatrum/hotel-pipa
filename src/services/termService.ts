// src/services/termService.ts — VERSÃO FINAL CORRIGIDA
import { db } from './firebase';
import { 
  doc, setDoc, getDoc, deleteDoc, collection, 
  getDocs, query, orderBy, addDoc 
} from 'firebase/firestore';
import type { TermSignature } from '../types';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION = 'termSignatures';

export async function generateTermToken(
  aptNumber: number,
  guestName: string,
  pax: number,
  phone?: string,
): Promise<{ token: string; url: string }> {
  const token = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60000);

  const data: TermSignature = {
    aptNumber,
    guestName,
    phone: phone || '',
    pax,
    token,
    signature: '',
    signedAt: '',
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: now.toISOString(),
  };

  await setDoc(doc(db, COLLECTION, token), data);

  const url = `/termo/${token}`;
  return { token, url };
}

export async function validateTermToken(token: string): Promise<TermSignature | null> {
  try {
    const docRef = doc(db, COLLECTION, token);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data() as TermSignature;

    if (new Date(data.expiresAt) < new Date()) {
      await deleteDoc(docRef);
      return null;
    }

    if (data.used) return null;

    return { ...data, id: docSnap.id };
  } catch (error) {
    console.error('Erro ao validar token do termo:', error);
    return null;
  }
}

export async function saveTermSignature(
  token: string,
  signatureBase64: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenData = await validateTermToken(token);
    if (!tokenData) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    // USAR SDK DIRETO (não REST)
    const docRef = doc(db, COLLECTION, token);
    await setDoc(docRef, {
      signature: signatureBase64,
      signedAt: new Date().toISOString(),
      used: true,
    }, { merge: true });

    // Log
    try {
      await addDoc(collection(db, 'log'), {
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('pt-BR'),
        apt: tokenData.aptNumber,
        msg: `📝 Termo assinado: ${tokenData.guestName} - ${tokenData.pax} hóspede(s)`,
        type: 'checkin',
        ts: Date.now(),
        userId: 'guest',
        userName: tokenData.guestName || 'Hóspede',
      });
    } catch (logError) {
      console.warn('Não foi possível registrar log:', logError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao salvar assinatura do termo:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllTermSignatures(): Promise<TermSignature[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TermSignature));
}

export async function deleteTermSignature(token: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, token));
}

export async function clearUsedTermSignatures(): Promise<number> {
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as TermSignature;
    if (data.used) {
      await deleteDoc(docSnap.ref);
      count++;
    }
  }

  return count;
}

export async function clearAllTermSignatures(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
  }
  return snapshot.size;
}