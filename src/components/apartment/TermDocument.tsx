// src/components/apartment/TermDocument.tsx
import { forwardRef } from 'react';
import type { TermSignature } from '../../types';

interface TermDocumentProps {
  signature: TermSignature;
}

export const TermDocument = forwardRef<HTMLDivElement, TermDocumentProps>(
  function TermDocument({ signature }, ref) {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '—';
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8"
        style={{
          width: '794px', // A4 width em pixels (a 96dpi)
          minHeight: '500px',
          fontFamily: 'serif',
        }}
      >
        {/* Cabeçalho */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-xl font-bold tracking-wide uppercase">
            Hotel da Pipa
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Praia de Pipa • Rio Grande do Norte • Brasil
          </p>
          <h2 className="text-lg font-semibold mt-4">
            TERMO DE RESPONSABILIDADE
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Controle de Toalhas e Fichas de Piscina
          </p>
        </div>

        {/* Corpo do termo */}
        <div className="space-y-4 text-justify leading-relaxed">
          <p>
            <strong>Declaro para devidos fins</strong> que, na condição de hóspede do
            apartamento <strong>{signature.aptNumber}</strong>, recebi a quantidade de{' '}
            <strong>{signature.pax} ficha(s)</strong> para toalhas de piscina
            (uma unidade por hóspede/dia).
          </p>

          <p>
            Na falta da devolução da mesma, estou ciente que pagarei o valor de{' '}
            <strong className="text-red-700">R$ 80,00</strong> por toalha ou ficha
            não devolvida no ato do check-out.
          </p>

          <p>
            Por fim, <strong>dou ciência da obrigatoriedade</strong> da devolução
            da mesma no ato do check-out.
          </p>
        </div>

        {/* Dados do hóspede e check-in */}
        <div className="mt-8 border border-gray-400 rounded p-4 bg-gray-50">
          <h3 className="font-bold text-sm uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
            Dados da Estadia
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Hóspede:</span>
              <p className="font-semibold">{signature.guestName}</p>
            </div>
            <div>
              <span className="text-gray-600">Apartamento:</span>
              <p className="font-semibold">{signature.aptNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Nº de Hóspedes:</span>
              <p className="font-semibold">{signature.pax}</p>
            </div>
            <div>
              <span className="text-gray-600">Fichas Entregues:</span>
              <p className="font-semibold">{signature.pax} ficha(s)</p>
            </div>
            {signature.phone && (
              <div className="col-span-2">
                <span className="text-gray-600">Telefone:</span>
                <p className="font-semibold">{signature.phone}</p>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-gray-600">Data do Check-in:</span>
              <p className="font-semibold">{formatDate(signature.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Assinatura */}
        <div className="mt-8">
          <h3 className="font-bold text-sm uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
            Assinatura do Hóspede
          </h3>

          <div className="flex items-end justify-between">
            <div className="flex-1 mr-8">
              {signature.signature ? (
                <img
                  src={signature.signature}
                  alt="Assinatura do hóspede"
                  className="max-h-24 object-contain border-b border-gray-800"
                />
              ) : (
                <div className="h-24 border-b border-gray-400"></div>
              )}
              <p className="text-xs text-gray-500 mt-1">Assinatura digital</p>
            </div>

            <div className="text-right text-sm">
              <p className="text-gray-600">Assinado em:</p>
              <p className="font-semibold">{formatDate(signature.signedAt)}</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-400 text-center text-xs text-gray-500">
          <p>
            Este documento digital tem validade jurídica conforme Lei nº 14.063/2020.
          </p>
          <p className="mt-1">
            Hotel da Pipa — Documento gerado em{' '}
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    );
  }
);