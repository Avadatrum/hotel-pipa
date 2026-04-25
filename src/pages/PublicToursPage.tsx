import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { formatCurrency } from '../utils/commissionCalculations';
import type { Tour, Sale } from '../types';

// Utilitário para limpar HTML fora do componente para performance
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};

// --- SUB-COMPONENTE: TOUR CARD ---
const TourCard = React.memo(({ tour }: { tour: Tour }) => {
  const whatsappNumber = '5584999999999';
  const text = encodeURIComponent(
    `Olá! Tenho interesse no passeio *${tour.nome}* e gostaria de saber mais informações. 🌊`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;

  return (
    <article className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
      {/* Imagem com Aspect Ratio fixo para Mobile */}
      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
        {tour.fotos?.[0] ? (
          <img
            src={tour.fotos[0]}
            alt={tour.nome}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-5xl">🏖️</div>
        )}
        
        {/* Badge de Categoria */}
        <div className="absolute top-4 left-4">
          {tour.tipo && (
            <span className="bg-white/90 backdrop-blur-md text-[#1a3a4a] text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-full shadow-sm">
              {tour.tipo}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-slate-800 font-serif text-2xl font-bold leading-tight mb-2">
          {tour.nome}
        </h3>

        <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
          {tour.descricao ? stripHtml(tour.descricao) : 'Explore as belezas naturais de Pipa neste passeio incrível.'}
        </p>

        {/* Tags de Info Curta */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center text-[11px] font-semibold bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-100">
             {tour.tipoPreco === 'por_pessoa' ? '👤 Por pessoa' : '🚤 Por saída'}
          </div>
          {tour.capacidadeMaxima && (
            <div className="flex items-center text-[11px] font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100">
              👥 Até {tour.capacidadeMaxima}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50">
          <div className="flex flex-col mb-4">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">A partir de</span>
            <span className="text-3xl font-black text-[#1a3a4a]">
              {formatCurrency(tour.precoBase)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <Link
              to={`/passeio/${tour.id}`}
              className="order-2 sm:order-1 text-center py-3.5 rounded-xl text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
            >
              Ver Detalhes
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="order-1 sm:order-2 text-center py-3.5 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#1eb956] text-white shadow-lg shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Reservar Agora</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
});

// --- COMPONENTE PRINCIPAL ---
export function PublicToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('todos');

  useEffect(() => {
    async function loadTours() {
      try {
        const toursQuery = query(collection(db, 'tours'), where('ativo', '==', true));
        const salesQuery = query(collection(db, 'sales'), where('status', '==', 'confirmada'));
        
        const [toursSnapshot, salesSnapshot] = await Promise.all([
          getDocs(toursQuery),
          getDocs(salesQuery)
        ]);
        
        const toursList: Tour[] = [];
        toursSnapshot.forEach((doc) => {
          toursList.push({ id: doc.id, ...doc.data() } as Tour);
        });
        
        const countMap: Record<string, number> = {};
        salesSnapshot.forEach((doc) => {
          const sale = doc.data() as Sale;
          countMap[sale.passeioId] = (countMap[sale.passeioId] || 0) + sale.quantidade;
        });
        
        toursList.sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));
        setTours(toursList);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTours();
  }, []);

  const categories = useMemo(() => 
    ['todos', ...new Set(tours.map(t => t.tipo || 'Outros'))], 
  [tours]);

  const filteredTours = useMemo(() => 
    selectedCategory === 'todos' 
      ? tours 
      : tours.filter(t => (t.tipo || 'Outros') === selectedCategory),
    [tours, selectedCategory]
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[500px] bg-slate-200/50 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] font-sans text-slate-900 pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HERO SECTION - Mais compacta no mobile */}
      <section className="bg-[#1a3a4a] text-white pt-16 pb-24 px-6 text-center relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="inline-block px-4 py-1.5 bg-amber-400 text-[#1a3a4a] rounded-full text-[10px] font-black tracking-widest uppercase mb-4">
             Experiências em Pipa
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 tracking-tight leading-none">
            Viva o <span className="italic text-amber-200">Paraíso</span>
          </h1>
          <p className="text-base md:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Indicações selecionadas para você viver o melhor de Pipa
          </p>
        </div>
      </section>

      {/* DISCLAIMER - Card flutuante */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-full hidden sm:block">📢</div>
          <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">
            <strong>Aviso de Intermediação</strong> O Hotel da Pipa atua exclusivamente como canal de divulgação e indicação de experiências locais. Não somos os organizadores dos passeios e não nos responsabilizamos pela prestação, segurança ou cancelamento dos serviços contratados diretamente com os operadores parceiros.
          </p>
        </div>
      </div>

      {/* CATEGORIAS - Scroll horizontal no mobile */}
      <nav className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-nowrap overflow-x-auto gap-3 pb-4 hide-scrollbar sm:flex-wrap sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-tighter border-2 ${
                selectedCategory === cat
                  ? 'bg-[#1a3a4a] text-white border-[#1a3a4a] shadow-lg shadow-blue-900/20'
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
              }`}
            >
              {cat === 'todos' ? '🌴 Todos' : cat}
            </button>
          ))}
        </div>
      </nav>

      {/* GRID */}
      <main className="max-w-6xl mx-auto px-6">
        {filteredTours.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <h3 className="font-serif text-xl font-bold text-slate-400">Nenhum passeio nesta categoria</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 py-10 text-center border-t border-slate-200">
         <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">
           © {new Date().getFullYear()} Hotel da Pipa
         </p>
      </footer>
    </div>
  );
}