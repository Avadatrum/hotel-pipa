// src/pages/TermSignaturesPage.tsx
import { useState, useEffect } from 'react';
import {
  getAllTermSignatures,
  deleteTermSignature,
  clearUsedTermSignatures,
  clearAllTermSignatures,
} from '../services/termService';
import type { TermSignature } from '../types';
import { TermDocument } from '../components/apartment/TermDocument';
import { useTermPDF } from '../hooks/useTermPDF';

export function TermSignaturesPage() {
  const [signatures, setSignatures] = useState<TermSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [printTarget, setPrintTarget] = useState<TermSignature | null>(null);
  const [generating, setGenerating] = useState(false);

  const { printRef, generatePDF } = useTermPDF();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllTermSignatures();
      setSignatures(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Gera o PDF quando printTarget mudar
  useEffect(() => {
    if (!printTarget) return;

    const doGenerate = async () => {
      setGenerating(true);
      // Pequeno delay para o DOM renderizar o componente oculto
      await new Promise((r) => setTimeout(r, 300));
      await generatePDF(printTarget.guestName, printTarget.aptNumber);
      setPrintTarget(null);
      setGenerating(false);
    };

    doGenerate();
  }, [printTarget, generatePDF]);

  const handleDelete = async (token: string) => {
    if (!confirm('Excluir esta assinatura?')) return;
    await deleteTermSignature(token);
    setSignatures((prev) => prev.filter((s) => s.token !== token));
  };

  const handleClearUsed = async () => {
    if (!confirm('Excluir todas as assinaturas já utilizadas?')) return;
    const count = await clearUsedTermSignatures();
    alert(`${count} assinatura(s) removida(s).`);
    load();
  };

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Excluir TODAS as assinaturas (incluindo pendentes)?'))
      return;
    const count = await clearAllTermSignatures();
    alert(`${count} assinatura(s) removida(s).`);
    load();
  };

  const handlePrint = (signature: TermSignature) => {
    setPrintTarget(signature);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Componente oculto para renderizar o PDF */}
      {printTarget && (
        <div className="fixed left-[-9999px] top-0">
          <TermDocument ref={printRef} signature={printTarget} />
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            📝 Assinaturas de Termos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {signatures.length} registro(s) encontrado(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearUsed}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            🗑️ Limpar Usados
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            🚨 Limpar Tudo
          </button>
          <button
            onClick={load}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Indicador de geração */}
      {generating && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Gerando PDF...</span>
        </div>
      )}

      {/* Grid de assinaturas */}
      {signatures.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Nenhuma assinatura encontrada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Os termos assinados aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col"
            >
              {/* Status */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-800 dark:text-white truncate">
                    {sig.guestName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Apto {sig.aptNumber} • {sig.pax} hóspede(s)
                  </p>
                  {sig.phone && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      📱 {sig.phone}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sig.used
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}
                >
                  {sig.used ? '✓ Assinado' : '⏳ Pendente'}
                </span>
              </div>

              {/* Assinatura */}
              {sig.used && sig.signature ? (
                <div
                  className="relative group cursor-pointer mb-3"
                  onClick={() => setSelectedImage(sig.signature)}
                >
                  <img
                    src={sig.signature}
                    alt={`Assinatura de ${sig.guestName}`}
                    className="w-full h-24 object-contain bg-slate-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs bg-black/50 px-2 py-1 rounded-full transition-opacity">
                      🔍 Ampliar
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-24 bg-slate-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-3 border border-gray-200 dark:border-gray-600">
                  Aguardando assinatura
                </div>
              )}

              {/* Datas */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                <p>
                  📅 Criado:{' '}
                  {sig.createdAt
                    ? new Date(sig.createdAt).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
                {sig.signedAt && (
                  <p>
                    ✍️ Assinado:{' '}
                    {new Date(sig.signedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                {sig.used && (
                  <button
                    onClick={() => handlePrint(sig)}
                    className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    🖨️ PDF
                  </button>
                )}
                <button
                  onClick={() => sig.token && handleDelete(sig.token)}
                  className="flex-1 py-2 text-xs font-medium border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de imagem ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors text-lg"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Assinatura ampliada"
              className="max-w-[90vw] max-h-[85vh] object-contain bg-white rounded-lg p-4 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}