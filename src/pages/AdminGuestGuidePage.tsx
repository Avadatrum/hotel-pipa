// src/pages/AdminGuestGuidePage.tsx

import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { getGuideConfig, saveGuideConfig } from '../services/guestGuideService';
import type { GuestGuideConfig, GuestGuideContent, GuideLanguage, GuidePlace } from '../types/guestGuide.types';

// ─── Constantes ─────────────────────────────────────────────────
const LANGUAGES: { code: GuideLanguage; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
];

const CATEGORIES: { value: GuidePlace['category']; label: string; emoji: string }[] = [
  { value: 'beach', label: 'Praia', emoji: '🏖️' },
  { value: 'restaurant', label: 'Restaurante', emoji: '🍽️' },
  { value: 'bar', label: 'Bar', emoji: '🍸' },
  { value: 'shop', label: 'Loja', emoji: '🛍️' },
  { value: 'attraction', label: 'Atração', emoji: '🎯' },
  { value: 'other', label: 'Outro', emoji: '📍' },
];

const SCHEDULE_FIELDS = [
  { key: 'breakfast', label: 'Café da Manhã', icon: '🌅' },
  { key: 'afternoonTea', label: 'Chá da Tarde', icon: '🫖' },
  { key: 'restaurant', label: 'Restaurante', icon: '🍽️' },
  { key: 'pool', label: 'Piscina', icon: '🏊' },
  { key: 'checkout', label: 'Check-out', icon: '🚪' },
];

// ─── Componentes Internos ──────────────────────────────────────

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h2 className="font-bold text-stone-800 text-base">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function InputField({ label, value, onChange, placeholder, mono = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-stone-50 hover:bg-white transition-colors ${
          mono ? 'font-mono tracking-wider' : ''
        }`}
      />
    </div>
  );
}

function HTMLEditor({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
            preview ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          {preview ? '✏️ Editar' : '👁️ Preview'}
        </button>
      </div>
      
      {preview ? (
        <div className="prose prose-sm max-w-none p-4 border border-stone-200 rounded-xl bg-stone-50 min-h-[120px]" dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="w-full border border-stone-200 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-stone-50 hover:bg-white transition-colors resize-y"
          placeholder="<p>Use HTML para formatar...</p>"
        />
      )}
    </div>
  );
}

function RulesEditor({ rules, onChange }: { rules: string[]; onChange: (rules: string[]) => void }) {
  return (
    <div className="space-y-4">
      {rules.map((rule, index) => (
        <div key={index} className="p-4 border border-stone-200 rounded-xl bg-stone-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              Regra {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(rules.filter((_, i) => i !== index))}
              className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
            >
              ✕ Remover
            </button>
          </div>
          <HTMLEditor value={rule} onChange={(v) => { const u = [...rules]; u[index] = v; onChange(u); }} label="" />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rules, '<p>Nova regra...</p>'])}
        className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-sm font-bold text-stone-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
      >
        + Adicionar Regra
      </button>
    </div>
  );
}

function PlacesEditor({ places, onChange }: { places: GuidePlace[]; onChange: (places: GuidePlace[]) => void }) {
  const addPlace = () => {
    const newPlace: GuidePlace = {
      id: `place-${Date.now()}`,
      name: { pt: 'Novo lugar', es: 'Nuevo lugar', en: 'New place' },
      description: { pt: 'Descrição', es: 'Descripción', en: 'Description' },
      category: 'other',
      lat: -6.2295,
      lng: -35.0486,
      order: places.length + 1
    };
    onChange([...places, newPlace]);
  };

  const updatePlace = (index: number, field: keyof GuidePlace, value: any) => {
    const updated = [...places];
    (updated[index] as any)[field] = value;
    onChange(updated);
  };

  const updatePlaceName = (index: number, lang: GuideLanguage, value: string) => {
    const updated = [...places];
    updated[index].name[lang] = value;
    onChange(updated);
  };

  const updatePlaceDesc = (index: number, lang: GuideLanguage, value: string) => {
    const updated = [...places];
    updated[index].description[lang] = value;
    onChange(updated);
  };

  const removePlace = (index: number) => {
    onChange(places.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {places
        .sort((a, b) => a.order - b.order)
        .map((place, index) => (
          <div key={place.id} className="p-4 border border-stone-200 rounded-xl bg-stone-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{place.icon || '📍'}</span>
                <span className="text-xs font-bold text-stone-600">
                  {place.name.pt || 'Novo lugar'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Ordem:</span>
                <input
                  type="number"
                  value={place.order}
                  onChange={(e) => updatePlace(index, 'order', parseInt(e.target.value) || 0)}
                  className="w-14 text-center border border-stone-200 rounded-lg px-2 py-1 text-xs"
                />
                <button
                  onClick={() => removePlace(index)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={place.category}
                onChange={(e) => updatePlace(index, 'category', e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={place.icon || ''}
                onChange={(e) => updatePlace(index, 'icon', e.target.value)}
                placeholder="Ícone emoji"
                className="border border-stone-200 rounded-lg px-3 py-2 text-xs"
              />
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.0001"
                  value={place.lat}
                  onChange={(e) => updatePlace(index, 'lat', parseFloat(e.target.value) || 0)}
                  placeholder="Lat"
                  className="w-1/2 border border-stone-200 rounded-lg px-2 py-2 text-xs"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={place.lng}
                  onChange={(e) => updatePlace(index, 'lng', parseFloat(e.target.value) || 0)}
                  placeholder="Lng"
                  className="w-1/2 border border-stone-200 rounded-lg px-2 py-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <div key={lang.code} className="flex items-center gap-2">
                  <span className="text-xs w-6">{lang.flag}</span>
                  <input
                    type="text"
                    value={place.name[lang.code]}
                    onChange={(e) => updatePlaceName(index, lang.code, e.target.value)}
                    placeholder={`Nome em ${lang.label}`}
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <div key={lang.code} className="flex items-start gap-2">
                  <span className="text-xs w-6 mt-1.5">{lang.flag}</span>
                  <textarea
                    value={place.description[lang.code]}
                    onChange={(e) => updatePlaceDesc(index, lang.code, e.target.value)}
                    placeholder={`Descrição em ${lang.label}`}
                    rows={2}
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-xs resize-y"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      
      <button
        type="button"
        onClick={addPlace}
        className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-sm font-bold text-stone-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
      >
        + Adicionar Lugar
      </button>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────

export function AdminGuestGuidePage() {
  const { showToast } = useToast();
  const [config, setConfig] = useState<GuestGuideConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<GuideLanguage>('pt');

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const data = await getGuideConfig();
      setConfig(data);
    } catch {
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
    } catch {
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 🆕 ATUALIZADO: Gerencia campos globais vs campos por idioma
  const updateContent = (field: keyof GuestGuideContent, value: any) => {
    if (!config) return;
    
    // Lugares são compartilhados entre todos os idiomas (estrutura global)
    if (field === 'places') {
      setConfig({
        ...config,
        content: {
          pt: { ...config.content.pt, places: value },
          es: { ...config.content.es, places: value },
          en: { ...config.content.en, places: value }
        }
      });
      return;
    }
    
    // Demais campos: específicos por idioma (ex: rules, beachInfo)
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

  const updateNestedField = (parent: 'wifi' | 'schedules' | 'contacts', field: string, value: string) => {
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
            [parent]: { ...parentData, [field]: value }
          }
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">📭</span>
        <p className="text-stone-500 font-medium">Configuração não encontrada</p>
        <button onClick={loadConfig} className="mt-4 text-amber-700 font-bold text-sm hover:underline">Tentar novamente</button>
      </div>
    );
  }

  const content = config.content[activeLang];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">📱 Guia do Hóspede</h1>
          <p className="text-sm text-stone-500 mt-1">Edite todo o conteúdo do guia digital</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-700 text-white rounded-2xl font-bold hover:bg-amber-800 transition-colors disabled:opacity-50 shadow-lg shadow-amber-200"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>💾 Salvar Tudo</>
          )}
        </button>
      </div>

      {/* Seletor de idioma */}
      <div className="flex gap-2 mb-8 bg-stone-100 rounded-2xl p-1.5 w-fit">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeLang === lang.code
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="space-y-6">
        
        {/* WiFi */}
        <Section icon="📶" title="Wi-Fi">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Rede" value={content.wifi.network} onChange={(v) => updateNestedField('wifi', 'network', v)} />
            <InputField label="Senha" value={content.wifi.password} onChange={(v) => updateNestedField('wifi', 'password', v)} mono />
          </div>
        </Section>

        {/* Horários */}
        <Section icon="🕐" title="Horários">
          <div className="grid grid-cols-2 gap-4">
            {SCHEDULE_FIELDS.map(({ key, label, icon }) => (
              <InputField
                key={key}
                label={`${icon} ${label}`}
                value={content.schedules[key as keyof typeof content.schedules]}
                onChange={(v) => updateNestedField('schedules', key, v)}
                placeholder="Ex: 8h às 10h30"
              />
            ))}
          </div>
        </Section>

        {/* Contatos */}
        <Section icon="📞" title="Contatos">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="📱 Recepção" value={content.contacts.reception} onChange={(v) => updateNestedField('contacts', 'reception', v)} />
            <InputField label="🚨 Emergência" value={content.contacts.emergency} onChange={(v) => updateNestedField('contacts', 'emergency', v)} />
          </div>
        </Section>

        {/* Regras */}
        <Section icon="📋" title="Regras do Hotel">
          <RulesEditor rules={content.rules} onChange={(rules) => updateContent('rules', rules)} />
        </Section>

        {/* Praias */}
        <Section icon="🏖️" title="Informações das Praias">
          <HTMLEditor value={content.beachInfo} onChange={(v) => updateContent('beachInfo', v)} label="Conteúdo sobre praias" />
        </Section>

        {/* 🆕 Lugares (Como Chegar) */}
        <Section icon="🗺️" title="Lugares Recomendados (Como Chegar)">
          <p className="text-xs text-stone-400 mb-4 leading-relaxed">
            Esses lugares aparecem no modal "Como Chegar" do guia do hóspede, com link para o Google Maps.
          </p>
          <PlacesEditor places={content.places || []} onChange={(places) => updateContent('places', places)} />
        </Section>

      </div>

      {/* Botão final */}
      <div className="flex justify-end mt-8 pb-12">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber-700 text-white rounded-2xl font-bold text-lg hover:bg-amber-800 transition-colors disabled:opacity-50 shadow-xl shadow-amber-200"
        >
          {saving ? 'Salvando...' : '💾 Salvar Todas as Alterações'}
        </button>
      </div>
    </div>
  );
}