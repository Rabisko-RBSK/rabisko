import api from './index';

/**
 * Resultado de GET /artist/search — bate 1:1 com ArtistSearchResultDTO no
 * backend. Mantenha em sync se o DTO mudar.
 */
export interface ArtistSearchResult {
  tatuadorId: string;
  nome: string;
  email: string;
  endereco: string | null;
}

export interface ArtistSearchParams {
  /** Lista de nomes de estilo (ex.: ["Realismo"]). Match case-insensitive. */
  estilo?: string[];
  /** Latitude/longitude do dispositivo. Ambos exigidos pra filtro de distancia. */
  lat?: number;
  lng?: number;
  /** Raio em km. Default no backend = 25 km. */
  raioKm?: number;
}

export const searchService = {
  /**
   * Busca tatuadores filtrando por estilo e/ou distancia. Axios serializa
   * `estilo` como `?estilo=A&estilo=B` (indices: false) — bate com o
   * @RequestParam List<String> estilo do ArtistController.
   */
  async buscarArtistas(params: ArtistSearchParams): Promise<ArtistSearchResult[]> {
    const { data } = await api.get<ArtistSearchResult[]>('/artist/search', {
      params,
      paramsSerializer: { indexes: false },
    });
    return data;
  },
};
