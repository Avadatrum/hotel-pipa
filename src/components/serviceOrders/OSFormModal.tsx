// src/components/serviceOrders/OSFormModal.tsx
import { useState, useEffect } from 'react';
import { 
  type OSFormData, 
  type OSType, 
  OS_TIPOS
} from '../../types/serviceOrder.types';
import { createServiceOrder, updateServiceOrder } from '../../services/serviceOrderService';
import { validateOSForm } from '../../utils/osHelpers';
import { useToast } from '../../hooks/useToast';

interface OSFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: any;
  mode?: 'create' | 'edit';
}

export function OSFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editData, 
  mode = 'create' 
}: OSFormModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<OSFormData>({
    titulo: '',
    descricao: '',
    tipo: 'manutencao_eletrica',
    local: '', 
    prazo: '',
    solicitanteSetor: '',
    executorId: '',
    executorNome: '',
    equipe: '',
    observacoes: '',
    // custoEstimado removido do estado
  });

  useEffect(() => {
    if (editData && mode === 'edit') {
      setFormData({
        titulo: editData.titulo || '',
        descricao: editData.descricao || '',
        tipo: editData.tipo || 'manutencao_eletrica',
        local: editData.local || editData.localNome || '',
        prazo: editData.prazo || '',
        solicitanteSetor: editData.solicitanteSetor || '',
        executorId: editData.executorId || '',
        executorNome: editData.executorNome || '',
        equipe: editData.equipe || '',
        observacoes: editData.observacoes || '',
        // custoEstimado removido do estado
      });
    }
  }, [editData, mode, isOpen]);

  const handleChange = (field: keyof OSFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando for alterado
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.titulo?.trim()) stepErrors.titulo = 'Título é obrigatório';
      if (!formData.descricao?.trim()) stepErrors.descricao = 'Descrição é obrigatória';
      if (!formData.tipo) stepErrors.tipo = 'Tipo é obrigatório';
    }
    
    if (step === 2) {
      if (!formData.local?.trim()) stepErrors.local = 'Local é obrigatório';
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateOSForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      if (mode === 'edit' && editData) {
        const updatePayload = { 
          ...formData, 
          localId: formData.local, 
          localNome: formData.local 
        }; 
        await updateServiceOrder(editData.id, updatePayload);
        showToast('OS atualizada com sucesso!', 'success');
      } else {
        const createPayload = { 
          ...formData, 
          localId: formData.local, 
          localNome: formData.local 
        };
        await createServiceOrder(createPayload);
        showToast('OS criada com sucesso!', 'success');
      }
      
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      showToast('Erro ao salvar OS', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      tipo: 'manutencao_eletrica',
      local: '',
      prazo: '',
      solicitanteSetor: '',
      executorId: '',
      executorNome: '',
      equipe: '',
      observacoes: '',
      // custoEstimado removido do estado
    });
    setCurrentStep(1);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'edit' ? 'Editar OS' : 'Nova Ordem de Serviço'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          {mode === 'create' && (
            <div className="flex items-center mt-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${currentStep > step 
                        ? 'bg-blue-600' 
                        : 'bg-gray-200 dark:bg-gray-700'
                      }
                    `} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Informações Básicas */}
            {(currentStep === 1 || mode === 'edit') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => handleChange('titulo', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.titulo ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Ex: Trocar lâmpada do corredor"
                  />
                  {errors.titulo && (
                    <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Serviço <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleChange('tipo', e.target.value as OSType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {OS_TIPOS.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.icon} {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    rows={4}
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.descricao ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Descreva detalhadamente o serviço a ser realizado..."
                  />
                  {errors.descricao && (
                    <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.descricao.length} caracteres
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Localização e Prazo */}
            {(currentStep === 2 || mode === 'edit') && (
              <div className="space-y-4">
                {/* Campo Local Alterado para Texto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Local <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.local}
                    onChange={(e) => handleChange('local', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.local ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="Ex: Apartamento 101, Piscina, Restaurante..."
                  />
                  {errors.local && (
                    <p className="text-xs text-red-500 mt-1">{errors.local}</p>
                  )}
                </div>

                {/* Seção de Prioridade REMOVIDA */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prazo (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.prazo}
                    onChange={(e) => handleChange('prazo', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Responsáveis e Observações */}
            {(currentStep === 3 || mode === 'edit') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Setor do Solicitante
                  </label>
                  <input
                    type="text"
                    value={formData.solicitanteSetor}
                    onChange={(e) => handleChange('solicitanteSetor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Manutenção, Governança, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Executor Responsável
                    </label>
                    <input
                      type="text"
                      value={formData.executorNome}
                      onChange={(e) => handleChange('executorNome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                               dark:bg-gray-700 dark:border-gray-600 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Equipe/Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.equipe}
                      onChange={(e) => handleChange('equipe', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                               dark:bg-gray-700 dark:border-gray-600 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Equipe ou terceirizada"
                    />
                  </div>
                </div>

                {/* Campo Custo Estimado REMOVIDO */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             dark:bg-gray-700 dark:border-gray-600 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Materiais necessários, instruções especiais..."
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            {mode === 'create' && currentStep > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                         dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            
            {mode === 'create' && currentStep < 3 && (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         transition-colors font-medium"
              >
                Próximo →
              </button>
            )}
            
            {(currentStep === 3 || mode === 'edit') && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar OS'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}