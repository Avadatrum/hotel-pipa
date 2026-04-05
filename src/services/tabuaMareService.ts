// src/services/tabuaMareService.ts
//
// Todas as chamadas passam por /tabua-mare-api/v2/...
// que é redirecionado para https://tabuamare.devtu.qzz.io/api pelo proxy:
//   - Em desenvolvimento: proxy do Vite (vite.config.ts)
//   - Em produção no Vercel: proxy do vercel.json
// Isso evita bloqueio de CORS sem precisar de Firebase Functions.

const BASE = '/tabua-mare-api/v2';

async function fetchTabua<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/${path}`, {
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
  return fetchTabua('states');
}

/** Lista os portos de um estado (ex: 'rn', 'pb', 'ce') */
export async function listarPortosPorEstado(estado: string) {
  return fetchTabua(`harbor_names/${estado.toLowerCase()}`);
}

/** Retorna detalhes de um ou mais portos por ID */
export async function buscarPortoPorId(ids: string[]) {
  return fetchTabua(`harbors/[${ids.join(',')}]`);
}

/**
 * Retorna a tábua de maré de um porto.
 * @param portoId  ID do porto (ex: 'rn01')
 * @param mes      Mês 1-12
 * @param dias     Dias (ex: '5' ou '1,2,3' ou '1-30')
 */
export async function buscarTabuaMare(portoId: string, mes: number, dias: string) {
  return fetchTabua(`tabua-mare/${portoId}/${mes}/[${dias}]`);
}

/** Porto mais próximo dentro de um estado */
export async function buscarPortoMaisProximoNoEstado(estado: string, lat: number, lng: number) {
  return fetchTabua(`nearested-harbor/${estado.toLowerCase()}/[${lat},${lng}]`);
}

/** Porto mais próximo sem filtrar por estado */
export async function buscarPortoMaisProximo(lat: number, lng: number) {
  return fetchTabua(`nearest-harbor-independent-state/[${lat},${lng}]`);
}

/** Tábua de maré por geolocalização */
export async function buscarTabuaPorGeolocalizacao(
  lat: number,
  lng: number,
  estado: string,
  mes: number,
  dias: string
) {
  return fetchTabua(
    `geo-tabua-mare/[${lat},${lng}]/${estado.toLowerCase()}/${mes}/[${dias}]`
  );
}