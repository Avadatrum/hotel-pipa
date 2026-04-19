// src/pages/lostAndFound/LostAndFoundScanPage.tsx
//
// Dependências necessárias:
//   npm install html5-qrcode qrcode.react
//
// html5-qrcode  → leitura de QR pela câmera
// qrcode.react  → geração de QR para cada item

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { useLostAndFound } from '../../contexts/LostAndFoundContext';
import { StatusBadge } from '../../components/lostAndFound/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LostItem } from '../../types/lostAndFound.types';

const categoryLabel: Record<string, string> = {
  eletrônico: 'Eletrônico', documento: 'Documento', roupa: 'Roupa',
  acessório: 'Acessório', bagagem: 'Bagagem', objeto_pessoal: 'Obj. Pessoal', outro: 'Outro',
};

// ── Componente de Scanner ─────────────────────────────────────────────────

const QrScanner: React.FC<{ onResult: (code: string) => void }> = ({ onResult }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const containerId = 'qr-reader-container';

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) throw new Error('Nenhuma câmera encontrada.');

      // Prefere câmera traseira
      const cam = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[0];

      await scanner.start(
        cam.id,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onResult(decodedText.trim());
          stopScanner();
        },
        () => {}
      );
      setRunning(true);
    } catch (e: any) {
      setError(e.message || 'Erro ao iniciar câmera.');
    }
  };

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {}
    setRunning(false);
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="space-y-4">
      <div
        id={containerId}
        className={`w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 ${
          running ? 'border-blue-500' : 'border-slate-200 dark:border-slate-700'
        } bg-slate-100 dark:bg-slate-800 min-h-[220px] flex items-center justify-center`}
      >
        {!running && (
          <p className="text-slate-400 text-sm">
            {error ? '⚠️ ' + error : 'Câmera inativa'}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!running ? (
          <button
            onClick={startScanner}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            📷 Iniciar Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
          >
            ⏹ Parar Scanner
          </button>
        )}
      </div>
    </div>
  );
};

// ── Componente de resultado do scan ──────────────────────────────────────

const ScannedItemCard: React.FC<{ item: LostItem; onClear: () => void }> = ({ item, onClear }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item encontrado</p>
        <p className="font-mono text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{item.uniqueCode}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={item.status} />
        <button
          onClick={onClear}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >✕</button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 text-sm">
      <InfoCell label="Categoria" value={categoryLabel[item.category] || item.category} />
      <InfoCell label="Cor" value={item.color || '—'} />
      <InfoCell label="Data encontrado" value={format(item.foundDate, 'dd/MM/yyyy', { locale: ptBR })} />
      <InfoCell label="Local" value={item.foundLocation} />
      <div className="col-span-2">
        <InfoCell label="Descrição" value={item.description} />
      </div>
      <InfoCell label="Entregue por" value={item.deliveredBy} />
      {item.status === 'entregue' && (
        <InfoCell label="Retirado por" value={item.returnedTo || '—'} />
      )}
    </div>

    {item.photoURL && (
      <img
        src={item.photoURL}
        alt="Foto do item"
        className="w-full max-h-48 object-contain rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
      />
    )}
  </div>
);

const InfoCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
  </div>
);

// ── Gerador de QR ─────────────────────────────────────────────────────────

const QrGenerator: React.FC<{ items: LostItem[] }> = ({ items }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LostItem | null>(null);

  const filtered = items.filter(
    (i) =>
      i.uniqueCode.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    if (!selected) return;
    const svg = document.getElementById('qr-print-svg');
    if (!svg) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR – ${selected.uniqueCode}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;gap:8px}
      p{margin:0;font-size:14px;font-weight:bold}</style></head>
      <body>
        ${svg.outerHTML}
        <p>${selected.uniqueCode}</p>
        <p style="font-weight:normal;font-size:11px">${selected.description.slice(0, 60)}</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar item por código ou descrição..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* Lista de itens */}
      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-800">
        {filtered.slice(0, 20).map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
              selected?.id === item.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
            }`}
          >
            <div>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{item.uniqueCode}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{item.description.slice(0, 40)}</span>
            </div>
            <StatusBadge status={item.status} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum item encontrado.</p>
        )}
      </div>

      {/* QR gerado */}
      {selected && (
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">QR Code para</p>
          <p className="font-mono text-lg font-black text-slate-800 dark:text-white">{selected.uniqueCode}</p>
          <div id="qr-print-svg">
            <QRCodeSVG
              value={selected.uniqueCode}
              size={180}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
            />
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
          >
            🖨️ Imprimir QR Code
          </button>
        </div>
      )}
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────

type Tab = 'scan' | 'generate';

export const LostAndFoundScanPage: React.FC = () => {
  const { items } = useLostAndFound();
  const [tab, setTab] = useState<Tab>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<LostItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleCodeSearch = (code: string) => {
    const found = items.find((i) => i.uniqueCode.toUpperCase() === code.toUpperCase());
    if (found) {
      setScannedItem(found);
      setNotFound(false);
    } else {
      setScannedItem(null);
      setNotFound(true);
    }
  };

  const tabCls = (t: Tab) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
      tab === t
        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Tabs internas */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('scan')}     className={tabCls('scan')}>📷 Ler QR Code</button>
        <button onClick={() => setTab('generate')} className={tabCls('generate')}>✨ Gerar QR Code</button>
      </div>

      {tab === 'scan' && (
        <div className="space-y-5">
          {/* Scanner por câmera */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
              Leitura por câmera
            </p>
            <QrScanner onResult={handleCodeSearch} />
          </div>

          {/* Busca manual */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Ou digite o código manualmente
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch(manualCode)}
                placeholder="Ex: ACH-25-00001"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-mono text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                onClick={() => handleCodeSearch(manualCode)}
                disabled={!manualCode.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all active:scale-95"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Resultado */}
          {scannedItem && (
            <ScannedItemCard item={scannedItem} onClear={() => { setScannedItem(null); setManualCode(''); }} />
          )}

          {notFound && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl">
              <span className="text-3xl mb-2">🔍</span>
              <p className="font-semibold text-sm">Nenhum item encontrado</p>
              <p className="text-xs mt-1">Verifique o código e tente novamente.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
            Gerar QR Code por item
          </p>
          <QrGenerator items={items} />
        </div>
      )}
    </div>
  );
};