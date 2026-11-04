import api from './index';
import type { EnderecoDTO, HorarioDTO } from './artistService';
import type { ColaboradorDTO } from './studioService';

/**
 * Resultado de GET /artist/search — bate 1:1 com ArtistSearchResultDTO no
 * backend. Mantenha em sync se o DTO mudar.
 */
export interface ArtistSearchResult {
  tatuadorId: string;
  nome: string;
  email: string;
  endereco: string | null;
  fotoPerfilUrl: string | null;
  /** Média das avaliações dos serviços (1 casa); null sem avaliações. */
  notaMedia: number | null;
  totalAvaliacoes: number;
  /** Estilos do portfólio, em ordem alfabética. */
  estilos: string[];
}

/** Resultado de GET /estudios/busca — StudioSearchResultDTO no backend. */
export interface StudioSearchResult {
  estudioId: string;
  nome: string;
  endereco: string | null;
  fotoPerfilUrl: string | null;
  /** Média das avaliações da equipe ativa; null sem avaliações. */
  notaMedia: number | null;
  totalAvaliacoes: number;
  totalTatuadores: number;
  /** Estilos do portfólio da equipe, em ordem alfabética. */
  estilos: string[];
}

/** Perfil público do estúdio (GET /estudios/{id}). */
export interface EstudioPublico {
  estudioId: string;
  nome: string;
  telefone: string | null;
  fotoPerfilUrl: string | null;
  endereco: EnderecoDTO | null;
  horarios: HorarioDTO[];
  /** Equipe ativa, incluindo o dono. */
  equipe: ColaboradorDTO[];
  /** Tatuador dono: "Conversar com o estúdio" abre o chat com ele. Null sem dono. */
  donoTatuadorId: string | null;
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

  /** Busca estúdios com os mesmos filtros de buscarArtistas (GET /estudios/busca). */
  async buscarEstudios(params: ArtistSearchParams): Promise<StudioSearchResult[]> {
    const { data } = await api.get<StudioSearchResult[]>('/estudios/busca', {
      params,
      paramsSerializer: { indexes: false },
    });
    return data;
  },

  async perfilEstudio(estudioId: string): Promise<EstudioPublico> {
    const { data } = await api.get<EstudioPublico>(`/estudios/${estudioId}`);
    return data;
  },
};
