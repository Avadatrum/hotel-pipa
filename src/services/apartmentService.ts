// src/services/apartmentService.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Apartment } from '../types';
import { addWithAudit } from './auditService';

// Onde faz o checkout, adicione:
import { clearSignaturesOnCheckout } from './towelService';

// Variável global para armazenar o usuário atual (será setada no AuthContext)
let currentUserId = '';
let currentUserName = '';

export function setCurrentUser(userId: string, userName: string) {
  currentUserId = userId;
  currentUserName = userName;
}

// Atualiza um apartamento no Firebase
export async function updateApartment(aptNumber: number, data: Partial<Apartment>) {
  const aptRef = doc(db, 'apartments', String(aptNumber));
  await setDoc(aptRef, data, { merge: true }); // merge = true mantém os campos não alterados
}

// Função de Check-in (MODIFICADA: adicionado parâmetro phone)
export async function doCheckin(
  aptNumber: number, 
  guestName: string, 
  pax: number,
  phone?: string  // NOVO: telefone opcional
) {
  // Prepara os dados para salvar
  const updateData: Partial<Apartment> = {
    occupied: true,
    guest: guestName,
    pax: pax,
    chips: pax,      // cada hóspede ganha uma ficha
    towels: 0        // começa sem toalhas
  };
  
  // Só adiciona telefone se foi fornecido
  if (phone && phone.trim()) {
    updateData.phone = phone.trim();
  }
  
  // Atualiza o apartamento
  await updateApartment(aptNumber, updateData);
  
  // Registra no log (inclui telefone se tiver)
  const logMessage = phone && phone.trim() 
    ? `Check-in — ${guestName} | ${pax} hóspede(s) | ${pax} ficha(s) | Tel: ${phone}`
    : `Check-in — ${guestName} | ${pax} hóspede(s) | ${pax} ficha(s)`;
    
  await addLog(aptNumber, logMessage, 'checkin');
  
  return { success: true };
}

// Função de Check-out
export async function doCheckout(aptNumber: number, lostTowels: number) {
  // Busca o apartamento atual para saber quantas toalhas tinha
  const aptRef = doc(db, 'apartments', String(aptNumber));
  const aptSnap = await getDoc(aptRef);
  const aptData = aptSnap.data() as Apartment;
  
  // Registra no log
  await addLog(aptNumber, `Check-out — ${aptData.guest || ''} | ${aptData.chips} ficha(s) | ${lostTowels} toalha(s) perdida(s)`, 'checkout');
  
  // Se houve perdas, registra no histórico de perdas
  if (lostTowels > 0) {
    await addLoss(aptNumber, aptData.block, aptData.guest || '', lostTowels);
  }
  
  // Dentro da função de checkout:
  await clearSignaturesOnCheckout(aptNumber);

  // Limpa o apartamento
  await updateApartment(aptNumber, {
    occupied: false,
    guest: '',
    pax: 0,
    chips: 0,
    towels: 0,
    phone: ''  // NOVO: limpa também o telefone
  });
  
  return { success: true, lostTowels };
}

// Função para ajustar fichas ou toalhas
export async function adjustItem(
  aptNumber: number,
  item: 'chips' | 'towels',
  delta: number,
  currentValue: number
) {
  const newValue = Math.max(0, currentValue + delta);
  
  await updateApartment(aptNumber, {
    [item]: newValue
  });
  
  // Registra no log
  const action = delta > 0 ? 'adicionada' : 'retirada';
  const emoji = item === 'chips' ? '🎫' : '🧺';
  await addLog(aptNumber, `${emoji} ${item === 'chips' ? 'Ficha' : 'Toalha'} ${action}. Total: ${newValue}.`, 'towel');
  
  return newValue;
}

// Função para adicionar log com auditoria
async function addLog(apt: number, msg: string, type: 'checkin' | 'checkout' | 'towel' | 'other') {
  const now = new Date();
  await addWithAudit('log', {
    apt,
    msg,
    type,
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('pt-BR'),
    ts: Date.now(),
  }, currentUserId, currentUserName);
}

// Função para adicionar perda
async function addLoss(apt: number, block: string, guest: string, lost: number) {
  const now = new Date();
  const { collection, addDoc } = await import('firebase/firestore');
  
  await addDoc(collection(db, 'losses'), {
    apt: apt,
    block: block,
    guest: guest,
    lost: lost,
    date: now.toLocaleDateString('pt-BR'),
    ts: Date.now()
  });
}

// Função para atualizar apenas o telefone do apartamento
export async function updateApartmentPhone(aptNumber: number, phone: string) {
  try {
    const aptRef = doc(db, 'apartments', String(aptNumber));
    await setDoc(aptRef, { phone: phone }, { merge: true });
    
    // Registra no log a alteração do telefone
    await addLog(aptNumber, `📱 Telefone atualizado: ${phone}`, 'other');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar telefone:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}