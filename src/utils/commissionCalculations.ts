// src/utils/commissionCalculations.ts
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Tour, Agency, CustomCommission } from '../types';

export async function calculateCommission(
  tourId: string,
  agenciaId: string | null,
  valorTotal: number,
  customCommissions: CustomCommission[]
): Promise<number> {
  // 1. Verificar comissão personalizada ativa
  const activeCustom = customCommissions.find(cc => {
    const isForTour = cc.passeioId === tourId;
    const isForAgency = !cc.passeioId && cc.agenciaId === agenciaId;
    const isActive = !cc.dataFim || new Date(cc.dataFim.toDate()) > new Date();
    return (isForTour || isForAgency) && isActive;
  });

  if (activeCustom) {
    if (activeCustom.tipoComissao === 'percentual') {
      return (valorTotal * activeCustom.valor) / 100;
    } else {
      return activeCustom.valor;
    }
  }

  // 2. Verificar comissão da agência
  if (agenciaId) {
    const agencyRef = doc(db, 'agencies', agenciaId);
    const agencySnap = await getDoc(agencyRef);
    const agencyData = agencySnap.data() as Agency;
    
    if (agencyData?.taxaComissaoPersonalizada !== null) {
      return (valorTotal * agencyData.taxaComissaoPersonalizada) / 100;
    }
  }

  // 3. Usar comissão padrão do passeio
  const tourRef = doc(db, 'tours', tourId);
  const tourSnap = await getDoc(tourRef);
  const tourData = tourSnap.data() as Tour;
  
  if (tourData?.comissaoPadrao) {
    return (valorTotal * tourData.comissaoPadrao) / 100;
  }

  // 4. Comissão padrão global (10%)
  return valorTotal * 0.10;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}