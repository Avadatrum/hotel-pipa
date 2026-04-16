// src/components/commissions/ToursTable.tsx
import { useState } from 'react';
import type { Tour } from '../../types/commission.types';
import { fmt } from '../../utils/formatHelpers';

interface Props {
  tours: Tour[];
  loading: boolean;
  onUpdateName: (id: string, v: string) => Promise<void>;
  onUpdatePrice: (id: string, v: number) => Promise<void>;
  onUpdateCommission: (tour: Tour, v: number) => Promise<void>;
  onToggleActive: (tour: Tour) => Promise<void>;
  onSendPromo: (tour: Tour) => void;
  onEditDetails?: (tour: Tour) => void;
  onDelete?: (tour: Tour) => void;
}

function Badge({ tipoPreco }: { tipoPreco: Tour['tipoPreco'] }) {
  return tipoPreco === 'por_passeio'
    ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">Veículo</span>
    : <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 font-medium">Por pessoa</span>;
}

function InlineInput({ defaultValue, onSave, onCancel, type = 'text' }: {
  defaultValue: string | number; onSave: (v: any) => void; onCancel: () => void; type?: string;
}) {
  const [val, setVal] = useState(String(defaultValue));
  return (
    <div className="flex items-center gap-1">
      <input autoFocus type={type} value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(type === 'number' ? parseFloat(val) : val); if (e.key === 'Escape') onCancel(); }}
        className="border rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button onClick={() => onSave(type === 'number' ? parseFloat(val) : val)} className="text-green-600 hover:text-green-700 font-bold text-sm">✓</button>
      <button onClick={onCancel} className="text-red-500 hover:text-red-600 font-bold text-sm">✕</button>
    </div>
  );
}

export function ToursTable({ 
  tours, 
  onUpdateName, 
  onUpdatePrice, 
  onUpdateCommission, 
  onToggleActive, 
  onSendPromo,
  onEditDetails,
  onDelete
}: Props) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingComm, setEditingComm] = useState<string | null>(null);

  // 🆕 Função para copiar o link
  const handleCopyLink = (tour: Tour) => {
    const link = `${window.location.origin}/passeio/${tour.id}`;
    navigator.clipboard?.writeText(link);
    alert('✅ Link copiado para a área de transferência!');
  };

  if (tours.length === 0) {
    return <p className="text-center text-gray-400 py-10 text-sm">Nenhum item encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-3 py-3 text-center hidden sm:table-cell">Tipo</th>
            <th className="px-3 py-3 text-center hidden md:table-cell">Capacidade</th>
            <th className="px-3 py-3 text-center">Preço base</th>
            <th className="px-3 py-3 text-center">Comissão</th>
            <th className="px-3 py-3 text-center hidden sm:table-cell">Margem</th>
            <th className="px-3 py-3 text-center">Status</th>
            <th className="px-3 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {tours.map(tour => (
            <tr key={tour.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group ${tour.ativo === false ? 'opacity-50' : ''}`}>
              {/* Nome */}
              <td className="px-4 py-3">
                {editingName === tour.id ? (
                  <InlineInput defaultValue={tour.nome}
                    onSave={v => { onUpdateName(tour.id, v); setEditingName(null); }}
                    onCancel={() => setEditingName(null)} />
                ) : (
                  <div className="flex items-start gap-1.5">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                        {tour.nome}
                        <button onClick={() => setEditingName(tour.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity text-xs">✏</button>
                      </div>
                      {tour.descricao && <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{tour.descricao}</div>}
                      {/* Indicador de fotos */}
                      {tour.fotos && tour.fotos.length > 0 && (
                        <div className="text-xs text-purple-500 mt-0.5">📸 {tour.fotos.length} foto(s)</div>
                      )}
                    </div>
                  </div>
                )}
              </td>

              {/* Tipo */}
              <td className="px-3 py-3 text-center hidden sm:table-cell"><Badge tipoPreco={tour.tipoPreco ?? 'por_pessoa'} /></td>

              {/* Capacidade */}
              <td className="px-3 py-3 text-center text-xs text-gray-500 hidden md:table-cell">
                {tour.tipoPreco === 'por_passeio' && tour.capacidadeMaxima ? `${tour.capacidadeMaxima} pax` : '—'}
              </td>

              {/* Preço */}
              <td className="px-3 py-3 text-center">
                {editingPrice === tour.id ? (
                  <InlineInput type="number" defaultValue={tour.precoBase}
                    onSave={v => { onUpdatePrice(tour.id, v); setEditingPrice(null); }}
                    onCancel={() => setEditingPrice(null)} />
                ) : (
                  <button onClick={() => setEditingPrice(tour.id)} className="group/price text-center hover:text-blue-600 transition-colors">
                    <div className="font-medium">{fmt(tour.precoBase)}</div>
                    <div className="text-[10px] text-gray-400">{tour.tipoPreco === 'por_passeio' ? 'por saída' : 'por pessoa'}</div>
                  </button>
                )}
              </td>

              {/* Comissão */}
              <td className="px-3 py-3 text-center">
                {editingComm === tour.id ? (
                  <InlineInput type="number" defaultValue={tour.comissaoPadrao}
                    onSave={v => { onUpdateCommission(tour, v); setEditingComm(null); }}
                    onCancel={() => setEditingComm(null)} />
                ) : (
                  <button onClick={() => setEditingComm(tour.id)} className="hover:text-green-700 transition-colors">
                    <div className="font-bold text-green-600">{fmt(tour.comissaoPadrao)}</div>
                    <div className="text-[10px] text-gray-400">{tour.tipoPreco === 'por_passeio' ? 'por saída' : 'por pessoa'}</div>
                  </button>
                )}
              </td>

              {/* Margem */}
              <td className="px-3 py-3 text-center text-xs text-gray-400 hidden sm:table-cell">
                {tour.precoBase > 0 ? `${((tour.comissaoPadrao / tour.precoBase) * 100).toFixed(1)}%` : '—'}
              </td>

              {/* Status */}
              <td className="px-3 py-3 text-center">
                <button onClick={() => onToggleActive(tour)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${tour.ativo !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 hover:bg-green-200' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 hover:bg-gray-200'}`}>
                  {tour.ativo !== false ? 'Ativo' : 'Inativo'}
                </button>
              </td>

              {/* Ações */}
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  {/* Botão Galeria/Detalhes */}
                  {onEditDetails && (
                    <button 
                      onClick={() => onEditDetails(tour)} 
                      title="Editar fotos e descrição"
                      className="text-xs px-2 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors font-medium"
                    >
                      🖼️
                    </button>
                  )}
                  
                  {/* 🆕 Botão Copiar Link */}
                  <button
                    onClick={() => handleCopyLink(tour)}
                    className="text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    title="Copiar link público"
                  >
                    🔗
                  </button>

                  <button 
                    onClick={() => onSendPromo(tour)} 
                    title="Enviar resumo por WhatsApp"
                    className="text-xs px-2 py-1.5 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-medium"
                  >
                    📱
                  </button>
                  
                  {/* Botão Deletar (apenas inativos) */}
                  {onDelete && tour.ativo === false && (
                    <button 
                      onClick={() => onDelete(tour)} 
                      title="Excluir permanentemente"
                      className="text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}