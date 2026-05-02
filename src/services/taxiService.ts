// src/services/taxiService.ts

import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface TaxiRequest {
  id?: string;
  aptNumber: number;
  guestName: string;
  phone?: string;
  status: 'pending' | 'attended' | 'cancelled';
  createdAt: any;
  attendedAt?: any;
  attendedBy?: string;
}

const TAXI_COLLECTION = 'taxiRequests';

// Hóspede solicita táxi
export async function requestTaxi(aptNumber: number, guestName: string, phone?: string): Promise<boolean> {
  try {
    // Verifica se já existe chamada pendente
    const q = query(
      collection(db, TAXI_COLLECTION),
      where('aptNumber', '==', aptNumber),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return false; // Já existe chamada pendente
    }

    await addDoc(collection(db, TAXI_COLLECTION), {
      aptNumber,
      guestName,
      phone: phone || null,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Erro ao solicitar táxi:', error);
    return false;
  }
}

// Painel: escuta novas solicitações
export function listenTaxiRequests(onNewRequest: (request: TaxiRequest) => void) {
  const q = query(
    collection(db, TAXI_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onNewRequest({
          id: change.doc.id,
          aptNumber: data.aptNumber,
          guestName: data.guestName,
          phone: data.phone,
          status: data.status,
          createdAt: data.createdAt
        });
      }
    });
  });
}

// Painel: marcar como atendido
export async function attendTaxiRequest(requestId: string, userName: string): Promise<void> {
  const docRef = doc(db, TAXI_COLLECTION, requestId);
  await updateDoc(docRef, {
    status: 'attended',
    attendedAt: serverTimestamp(),
    attendedBy: userName
  });
}

// Painel: buscar chamadas pendentes
export async function getPendingTaxiRequests(): Promise<TaxiRequest[]> {
  const q = query(
    collection(db, TAXI_COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TaxiRequest));
}