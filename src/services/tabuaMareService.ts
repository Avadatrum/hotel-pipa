// src/services/tabuaMareService.ts
//
// O frontend NÃO chama a API de marés diretamente (bloqueio de CORS).
// Todas as chamadas passam pelo proxy hospedado nas Firebase Functions.
//
// Para usar localmente com o emulador, defina no .env.local:
//   VITE_TABUA_MARE_PROXY_URL=http://localhost:5001/<projeto>/us-central1/tabuaMareProxy
//
// Em produção a variável não precisa ser definida — a URL é detectada automaticamente.

const PROJECT_ID =
  import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'toalhashotel';

const PROXY_URL =
  import.meta.env.VITE_TABUA_MARE_PROXY_URL ??
  `https://us-central1-${PROJECT_ID}.cloudfunctions.net/tabuaMareProxy`;

async function fetchProxy<T>(path: string): Promise<T> {
  const url = `${PROXY_URL}?path=${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(
      (erro as any)?.error ?? `Erro ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/** Lista todos os estados costeiros disponíveis */
export async function listarEstados() {
  return fetchProxy('states');
}

/** Lista os portos de um estado (ex: 'rn', 'pb', 'ce') */
export async function listarPortosPorEstado(estado: string) {
  return fetchProxy(`harbor_names/${estado.toLowerCase()}`);
}

/** Retorna detalhes de um ou mais portos por ID (ex: ['rn01']) */
export async function buscarPortoPorId(ids: string[]) {
  return fetchProxy(`harbors/[${ids.join(',')}]`);
}

/**
 * Retorna a tábua de maré de um porto para um determinado mês e dias.
 * @param portoId  ID do porto (ex: 'rn01')
 * @param mes      Mês 1-12
 * @param dias     String de dias (ex: '1,2,3' ou '1-30')
 */
export async function buscarTabuaMare(
  portoId: string,
  mes: number,
  dias: string
) {
  return fetchProxy(`tabua-mare/${portoId}/${mes}/[${dias}]`);
}

/**
 * Retorna o porto mais próximo dentro de um estado a partir de coordenadas.
 * @param estado  Sigla do estado (ex: 'rn')
 * @param lat     Latitude
 * @param lng     Longitude
 */
export async function buscarPortoMaisProximoNoEstado(
  estado: string,
  lat: number,
  lng: number
) {
  return fetchProxy(
    `nearested-harbor/${estado.toLowerCase()}/[${lat},${lng}]`
  );
}

/**
 * Retorna o porto mais próximo das coordenadas, sem filtrar por estado.
 * @param lat  Latitude
 * @param lng  Longitude
 */
export async function buscarPortoMaisProximo(lat: number, lng: number) {
  return fetchProxy(`nearest-harbor-independent-state/[${lat},${lng}]`);
}

/**
 * Retorna a tábua de maré pelo porto mais próximo das coordenadas informadas.
 * @param lat     Latitude
 * @param lng     Longitude
 * @param estado  Sigla do estado (ex: 'rn')
 * @param mes     Mês 1-12
 * @param dias    String de dias (ex: '1,2,3' ou '1-30')
 */
export async function buscarTabuaPorGeolocalizacao(
  lat: number,
  lng: number,
  estado: string,
  mes: number,
  dias: string
) {
  return fetchProxy(
    `geo-tabua-mare/[${lat},${lng}]/${estado.toLowerCase()}/${mes}/[${dias}]`
  );
}