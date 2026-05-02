// src/pages/AdminGuestGuidePage.tsx

import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { getGuideConfig, saveGuideConfig } from '../services/guestGuideService';
import type { GuestGuideConfig, GuestGuideContent, GuideLanguage } from '../types/guestGuide.types';

// Editor de texto rico simples com preview
function HTMLEditor({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  label: string;
}) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold text-stone-700 uppercase tracking-wide">{label}</label>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="text-xs text-amber-700 hover:text-amber-900 underline"
        >
          {preview ? 'Editar' : 'Preview'}
        </button>
      </div>
      
      {preview ? (
        <div 
          className="prose prose-sm max-w-none p-3 border border-stone-200 rounded-lg bg-stone-50 min-h-[100px]"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full border border-stone-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          placeholder="Use HTML para formatar..."
        />
      )}
      
      <p className="text-xs text-stone-400 mt-1">
        Dica: Use {'<strong>negrito</strong>'}, {'<p>parágrafos</p>'}, {'<br/>'} para quebras
      </p>
    </div>
  );
}

// Editor de regras (array de strings HTML)
function RulesEditor({ 
  rules, 
  onChange 
}: { 
  rules: string[]; 
  onChange: (rules: string[]) => void;
}) {
  const addRule = () => {
    onChange([...rules, '<p>Nova regra...</p>']);
  };

  const updateRule = (index: number, value: string) => {
    const updated = [...rules];
    updated[index] = value;
    onChange(updated);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-bold text-stone-700 uppercase tracking-wide">Regras do Hotel</label>
        <button
          type="button"
          onClick={addRule}
          className="text-xs bg-amber-700 text-white px-3 py-1 rounded-lg hover:bg-amber-800 transition-colors"
        >
          + Adicionar Regra
        </button>
      </div>
      
      {rules.map((rule, index) => (
        <div key={index} className="mb-3 p-3 border border-stone-200 rounded-lg bg-stone-50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-stone-500">Regra #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeRule(index)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              ✕ Remover
            </button>
          </div>
          <HTMLEditor
            value={rule}
            onChange={(v) => updateRule(index, v)}
            label=""
          />
        </div>
      ))}
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────

export function AdminGuestGuidePage() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<GuestGuideConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<GuideLanguage>('pt');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getGuideConfig();
      setConfig(data);
    } catch (error) {
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    
    try {
      await saveGuideConfig(config);
      showToast('Guia atualizado com sucesso! ✅', 'success');
    } catch (error) {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (field: keyof GuestGuideContent, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      content: {
        ...config.content,
        [activeLang]: {
          ...config.content[activeLang],
          [field]: value
        }
      }
    });
  };

  const updateNestedField = (
  parent: 'wifi' | 'schedules' | 'contacts',
  field: string,
  value: string
) => {
  if (!config) return;
  
  const langContent = config.content[activeLang];
  const parentData = langContent[parent];
  
  if (typeof parentData === 'object' && parentData !== null) {
    setConfig({
      ...config,
      content: {
        ...config.content,
        [activeLang]: {
          ...langContent,
          [parent]: {
            ...parentData,
            [field]: value
          }
        }
      }
    });
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) {
    return <div className="text-center py-12 text-stone-500">Configuração não encontrada</div>;
  }

  const content = config.content[activeLang];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Editar Guia do Hóspede</h1>
          <p className="text-sm text-stone-500 mt-1">Personalize o conteúdo que aparece no guia digital</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            '💾 Salvar Alterações'
          )}
        </button>
      </div>

      {/* Seletor de idioma */}
      <div className="flex gap-2 mb-8 bg-stone-100 rounded-lg p-1 w-fit">
        {(['pt', 'es', 'en'] as GuideLanguage[]).map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeLang === lang
                ? 'bg-white text-stone-900 shadow-sm font-bold'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {lang === 'pt' ? '🇧🇷 Português' : lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
        ))}
      </div>

      {/* WiFi */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          📶 Wi-Fi
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wide">
              Rede
            </label>
            <input
              type="text"
              value={content.wifi.network}
              onChange={(e) => updateNestedField('wifi', 'network', e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wide">
              Senha
            </label>
            <input
              type="text"
              value={content.wifi.password}
              onChange={(e) => updateNestedField('wifi', 'password', e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
            />
          </div>
        </div>
      </section>

      {/* Horários */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          🕐 Horários
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'breakfast', label: 'Café da Manhã' },
            { key: 'afternoonTea', label: 'Chá da Tarde' },
            { key: 'restaurant', label: 'Restaurante' },
            { key: 'pool', label: 'Piscina' },
            { key: 'checkout', label: 'Check-out' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wide">
                {label}
              </label>
              <input
                type="text"
                value={content.schedules[key as keyof typeof content.schedules]}
                onChange={(e) => updateNestedField('schedules', key, e.target.value)}
                className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: 8h às 10h30"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Contatos */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          📞 Contatos
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wide">
              Recepção
            </label>
            <input
              type="text"
              value={content.contacts.reception}
              onChange={(e) => updateNestedField('contacts', 'reception', e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 uppercase tracking-wide">
              Emergência
            </label>
            <input
              type="text"
              value={content.contacts.emergency}
              onChange={(e) => updateNestedField('contacts', 'emergency', e.target.value)}
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Regras */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          📋 Regras do Hotel
        </h2>
        <RulesEditor
          rules={content.rules}
          onChange={(rules) => updateContent('rules', rules)}
        />
      </section>

      {/* Informações da Praia */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-stone-200 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
          🏖️ Informações da Praia
        </h2>
        <HTMLEditor
          value={content.beachInfo}
          onChange={(v) => updateContent('beachInfo', v)}
          label="Conteúdo sobre praias"
        />
      </section>

      {/* Botão salvar no final também */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-bold text-lg disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          {saving ? 'Salvando...' : '💾 Salvar Todas as Alterações'}
        </button>
      </div>
    </div>
  );
}