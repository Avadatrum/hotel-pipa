//src/types/serviceOrder.types.ts

// ============================================
// TIPOS DO SISTEMA DE ORDENS DE SERVIÇO
// ============================================

// Enums e tipos básicos
type OSStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
// 🗑️ REMOVIDO: type OSPriority = ...
type OSType = 
  | 'manutencao_eletrica'
  | 'manutencao_hidraulica'
  | 'manutencao_civil'
  | 'limpeza_especial'
  | 'jardinagem'
  | 'ti_tecnologia'
  | 'climatizacao'
  | 'pintura'
  | 'marcenaria'
  | 'dedetizacao'
  | 'reforma'
  | 'instalacao'
  | 'inspecao'
  | 'outro';

// Interfaces
interface OSHistoryEntry {
  id: string;
  acao: string;
  descricao: string;
  usuarioId: string;
  usuarioNome: string;
  data: string;
  ts: number;
  statusAnterior?: OSStatus;
  statusNovo?: OSStatus;
}

interface ServiceOrder {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  tipo: OSType;
  local: string; // 🆕 Campo de texto livre
  status: OSStatus;
  // 🗑️ REMOVIDO: prioridade: OSPriority;
  dataCriacao: string;
  dataAtualizacao: string;
  dataConclusao?: string;
  prazo?: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteSetor?: string;
  executorId?: string;
  executorNome?: string;
  equipe?: string;
  observacoes?: string;
  historico: OSHistoryEntry[];
  // 🗑️ REMOVIDO: custoEstimado?: number;
  // 🗑️ REMOVIDO: custoReal?: number;
  criadoPor: string;
  criadoPorNome: string;
  atualizadoPor?: string;
  atualizadoPorNome?: string;
  ts: number;
}

interface OSFilters {
  status?: OSStatus[];
  // 🗑️ REMOVIDO: prioridade?: OSPriority[];
  tipo?: OSType[];
  local?: string; // 🆕 Filtro por texto
  solicitanteId?: string;
  executorId?: string;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}

interface OSFormData {
  titulo: string;
  descricao: string;
  tipo: OSType;
  local: string; // 🆕 Campo de texto livre
  // 🗑️ REMOVIDO: prioridade: OSPriority;
  prazo?: string;
  solicitanteSetor?: string;
  executorId?: string;
  executorNome?: string;
  equipe?: string;
  observacoes?: string;
  // 🗑️ REMOVIDO: custoEstimado?: number;
}

// Constantes
const OS_TIPOS = [
  { value: 'manutencao_eletrica' as OSType, label: 'Manutenção Elétrica', icon: '⚡' },
  { value: 'manutencao_hidraulica' as OSType, label: 'Manutenção Hidráulica', icon: '🚰' },
  { value: 'manutencao_civil' as OSType, label: 'Manutenção Civil', icon: '🏗️' },
  { value: 'limpeza_especial' as OSType, label: 'Limpeza Especial', icon: '🧹' },
  { value: 'jardinagem' as OSType, label: 'Jardinagem', icon: '🌿' },
  { value: 'ti_tecnologia' as OSType, label: 'TI / Tecnologia', icon: '💻' },
  { value: 'climatizacao' as OSType, label: 'Climatização / Ar', icon: '❄️' },
  { value: 'pintura' as OSType, label: 'Pintura', icon: '🎨' },
  { value: 'marcenaria' as OSType, label: 'Marcenaria', icon: '🪚' },
  { value: 'dedetizacao' as OSType, label: 'Dedetização', icon: '🐜' },
  { value: 'reforma' as OSType, label: 'Reforma Estrutural', icon: '🔨' },
  { value: 'instalacao' as OSType, label: 'Instalação', icon: '📦' },
  { value: 'inspecao' as OSType, label: 'Inspeção Preventiva', icon: '🔍' },
  { value: 'outro' as OSType, label: 'Outro', icon: '📋' },
];

const OS_STATUS = [
  { value: 'aberta' as OSStatus, label: 'Em Aberto', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'em_andamento' as OSStatus, label: 'Em Andamento', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'concluida' as OSStatus, label: 'Concluída', color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'cancelada' as OSStatus, label: 'Cancelada', color: 'text-gray-600', bgColor: 'bg-gray-100' },
];

// 🗑️ REMOVIDO: OS_PRIORIDADES
// 🗑️ REMOVIDO: OS_LOCAIS_PADRAO

// EXPORTAÇÕES
export type { OSStatus, OSType, ServiceOrder, OSFilters, OSFormData, OSHistoryEntry };
export { OS_TIPOS, OS_STATUS };