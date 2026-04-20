// src/components/lostAndFound/WhatsAppButton.tsx

import React from 'react';
import type { LostItem } from '../../types/lostAndFound.types';

// O parâmetro phoneNumber foi removido das Props e da função
interface WhatsAppButtonProps {
  item: LostItem;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ item }) => {
  const handleSend = () => {
    const message =
      `*HOTEL PIPA – ACHADOS E PERDIDOS*\n\n` +
      `🆔 *Código:* ${item.uniqueCode}\n` +
      `📅 *Data:* ${item.foundDate.toLocaleDateString('pt-BR')}\n` +
      `🏷️ *Categoria:* ${item.category}\n` +
      `📝 *Descrição:* ${item.description}\n` +
      (item.color ? `🎨 *Cor:* ${item.color}\n` : '') +
      `📍 *Local:* ${item.foundLocation}\n` +
      `👤 *Entregue por:* ${item.deliveredBy}\n` +
      `📞 *Telefone:* ${item.deliveredByPhone || 'Não informado'}\n` +
      `📌 *Status:* ${item.status === 'guardado' ? '🔵 AGUARDANDO RETIRADA' : '✅ ENTREGUE'}`;

    // 🎯 NOVO: Sem número definido - abre a tela de seleção de contato
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <button
      onClick={handleSend}
      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-600/20"
    >
      💬 Enviar para WhatsApp
    </button>
  );
};