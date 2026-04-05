// src/types/tabuaMare.types.ts

export interface Estado {
  sigla: string;
  nome: string;
}

export interface Porto {
  id: string;
  nome: string;
  estado: string;
  lat?: number;
  lng?: number;
}

export interface MareEvento {
  hora: string;      // ex: "03:12"
  altura: number;    // ex: 2.4 (metros)
  tipo: string;      // ex: "Alta" | "Baixa"
}

export interface MareDia {
  dia: number;
  mares: MareEvento[];
}

export interface TabuaMareResponse {
  porto: Porto;
  mes: number;
  dados: MareDia[];
}

export interface TabuaMareState {
  data: TabuaMareResponse | null;
  loading: boolean;
  error: string | null;
}