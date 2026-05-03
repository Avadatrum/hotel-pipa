// src/components/guestGuide/CopyButton.tsx

import { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
        copied
          ? 'bg-emerald-500 text-white'
          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
      }`}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" /> Copiado!
        </>
      ) : (
        <>
          <CopyIcon className="w-4 h-4" /> Copiar senha
        </>
      )}
    </button>
  );
}