// src/components/commissions/SalesRegister.tsx
import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, getDoc, getDocs, query, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useCommissions } from '../../contexts/CommissionContext';
import { useToast } from '../../hooks/useToast';
import type { Tour } from '../../types';

export function SalesRegister() {
  const { user } = useAuth();
  const { customCommissions, refreshData } = useCommissions(); 
  const { showToast } = useToast();
  
  // Lista local para popular o Select
  const [tourList, setTourList] = useState<Tour[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [currentTourData, setCurrentTourData] = useState<Tour | null>(null);
  
  const [quantidade, setQuantidade] = useState(1);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // --- NOVOS ESTADOS: Data e Hora do Passeio ---
  // Definimos a data padrão como 'hoje'
  const [dataPasseio, setDataPasseio] = useState(new Date().toISOString().split('T')[0]);
  const [horaPasseio, setHoraPasseio] = useState('09:00'); // Horário padrão
  
  const [loading, setLoading] = useState(false);
  const [loadingTour, setLoadingTour] = useState(false);
  const [precoTotal, setPrecoTotal] = useState(0);

  // Carrega a lista de passeios ao montar o componente
  useEffect(() => {
    const loadTours = async () => {
      setLoadingList(true);
      try {
        const q = query(collection(db, 'tours')); 
        const querySnapshot = await getDocs(q);
        const list: Tour[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Tour);
        });
        setTourList(list);
      } catch (error) {
        console.error("Erro ao carregar lista de passeios:", error);
        showToast('Erro ao carregar passeios', 'error');
      } finally {
        setLoadingList(false);
      }
    };
    loadTours();
  }, [showToast]);

  useEffect(() => {
    if (currentTourData) {
      setPrecoTotal(currentTourData.precoBase * quantidade);
    } else {
      setPrecoTotal(0);
    }
  }, [currentTourData, quantidade]);

  const handleTourChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTourId(id);
    
    if (id) {
      setLoadingTour(true);
      setCurrentTourData(null); 
      setQuantidade(1);
      
      try {
        const tourRef = doc(db, 'tours', id);
        const tourSnap = await getDoc(tourRef);

        if (tourSnap.exists()) {
          const data = tourSnap.data();
          const freshTour: Tour = {
            id: tourSnap.id,
            nome: data.nome,
            precoBase: data.precoBase,
            comissaoPadrao: data.comissaoPadrao,
            unidade: data.unidade || 'un',
            tipo: data.tipo, 
            agenciaId: data.agenciaId,
            ativo: data.ativo ?? true,
            createdAt: data.createdAt,
            createdBy: data.createdBy
          };
          setCurrentTourData(freshTour);
        } else {
          showToast('Passeio não encontrado no banco.', 'error');
        }
      } catch (error) {
        console.error('Erro ao buscar detalhes do passeio:', error);
        showToast('Erro ao carregar detalhes.', 'error');
      } finally {
        setLoadingTour(false);
      }
    } else {
      setCurrentTourData(null);
      setPrecoTotal(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTourData) {
      showToast('Selecione um passeio válido', 'warning');
      return;
    }
    
    if (!clienteNome) {
      showToast('Digite o nome do cliente', 'warning');
      return;
    }

    // Validação simples da data
    if (!dataPasseio) {
      showToast('Informe a data do passeio', 'warning');
      return;
    }
    
    setLoading(true);
    
    try {
      let valorComissaoUnitario = 0;
      const agora = new Date();

      const promocaoAtiva = customCommissions.find(c => 
        c.passeioId === currentTourData.id && 
        (!c.dataFim || c.dataFim.toDate() > agora)
      );

      if (promocaoAtiva) {
        valorComissaoUnitario = promocaoAtiva.valor;
      } else {
        valorComissaoUnitario = currentTourData.comissaoPadrao;
      }

      const comissaoTotal = valorComissaoUnitario * quantidade;
      
      // Formata a data e hora para salvar no banco (Ex: "03/04/2026 14:00")
      // Isso facilita muito a leitura direta no Console do Firebase
      const dataHoraPasseioFormatada = `${dataPasseio} ${horaPasseio}`;
      
      const saleData = {
        dataVenda: Timestamp.now(), // Data que a venda foi feita (hoje)
        dataPasseioRealizacao: dataHoraPasseioFormatada, // <--- NOVO CAMPO
        passeioId: currentTourData.id,
        passeioNome: currentTourData.nome,
        quantidade,
        precoUnitarioVendido: currentTourData.precoBase,
        valorTotal: precoTotal,
        comissaoCalculada: comissaoTotal,
        vendedorId: user?.id,
        vendedorNome: user?.name || user?.email,
        clienteNome,
        clienteTelefone,
        observacoes,
        status: 'confirmada',
        createdAt: Timestamp.now(),
        canceledAt: null,
        canceledBy: null
      };
      
      await addDoc(collection(db, 'sales'), saleData);
      
      showToast('✅ Venda registrada com sucesso!', 'success');
      
      // Limpa o formulário
      setSelectedTourId('');
      setCurrentTourData(null);
      setQuantidade(1);
      setClienteNome('');
      setClienteTelefone('');
      setObservacoes('');
      setPrecoTotal(0);
      // Não limpa a data/hora, pois pode ser para o mesmo dia/turma
      
      refreshData();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      showToast('❌ Erro ao registrar venda', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        📝 Registrar Venda de Passeio
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Passeio *
          </label>
          <div className="relative">
            <select
              value={selectedTourId}
              onChange={handleTourChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 appearance-none"
              required
              disabled={loadingTour || loadingList}
            >
              <option value="">{
                loadingList ? 'Carregando passeios...' : 'Selecione um passeio'
              }</option>
              {tourList.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.nome}
                </option>
              ))}
            </select>
            {(loadingTour || loadingList) && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-blue-500 animate-spin text-sm">
                ⏳
              </div>
            )}
          </div>
          
          {currentTourData && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800 text-sm space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Preço Base:</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  R$ {currentTourData.precoBase.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Comissão (Unit.):</span>
                <span className="font-bold text-green-700 dark:text-green-400 text-lg">
                  R$ {currentTourData.comissaoPadrao.toFixed(2)}
                </span>
              </div>
              {quantidade > 1 && (
                 <div className="border-t border-green-200 dark:border-green-800 mt-1 pt-1 flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Comissão:</span>
                  <span className="font-bold text-green-800 dark:text-green-300">
                    R$ {(currentTourData.comissaoPadrao * quantidade).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- NOVA SEÇÃO: Data e Hora do Passeio --- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Data do Passeio *
            </label>
            <input
              type="date"
              value={dataPasseio}
              onChange={(e) => setDataPasseio(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Horário *
            </label>
            <input
              type="time"
              value={horaPasseio}
              onChange={(e) => setHoraPasseio(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
        </div>
        {/* -------------------------------------------- */}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Quantidade *
            </label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              required
              disabled={!currentTourData}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Valor Total (Venda)
            </label>
            <input
              type="text"
              value={precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-600 font-semibold text-gray-800 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Nome do Cliente *
          </label>
          <input
            type="text"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Telefone do Cliente
          </label>
          <input
            type="tel"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || loadingTour || !currentTourData}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-bold flex justify-center items-center gap-2"
        >
          {loading ? <span className="animate-spin">⏳</span> : '💰 Registrar Venda'}
        </button>
      </form>
    </div>
  );
}