import api from './index';
import { ConviteDTO, ConviteDetalheDTO } from './artistService';

/** Tatuador da equipe do estúdio (GET /studio/me/colaboradores). */
export interface ColaboradorDTO {
  tatuadorId: string;
  nome: string;
  fotoPerfilUrl: string | null;
  instagram: string | null;
}

/**
 * Resultado da busca de tatuadores para convite (GET /studio/tatuadores).
 * O backend só devolve tatuadores ativos e sem estúdio.
 */
export interface TatuadorBuscaDTO {
  tatuadorId: string;
  nome: string;
  instagram: string | null;
  fotoPerfilUrl: string | null;
}

/** Rotas `/studio/**` — exigem role ESTUDIO no backend. */
export const studioService = {
  /** `termo` casa com nome, e-mail ou instagram; mínimo de 2 caracteres. */
  async buscarTatuadores(termo: string): Promise<TatuadorBuscaDTO[]> {
    const { data } = await api.get<TatuadorBuscaDTO[]>('/studio/tatuadores', {
      params: { termo },
    });
    return data;
  },

  async convidarTatuador(tatuadorId: string): Promise<ConviteDTO> {
    const { data } = await api.post<ConviteDTO>('/studio/me/convites', { tatuadorId });
    return data;
  },

  /** Convites pendentes enviados pelo estúdio. */
  async listarConvites(): Promise<ConviteDetalheDTO[]> {
    const { data } = await api.get<ConviteDetalheDTO[]>('/studio/me/convites');
    return data;
  },

  async cancelarConvite(conviteId: string): Promise<ConviteDTO> {
    const { data } = await api.delete<ConviteDTO>(`/studio/me/convites/${conviteId}`);
    return data;
  },

  async listarColaboradores(): Promise<ColaboradorDTO[]> {
    const { data } = await api.get<ColaboradorDTO[]>('/studio/me/colaboradores');
    return data;
  },

  async removerColaborador(tatuadorId: string): Promise<void> {
    await api.delete(`/studio/me/colaboradores/${tatuadorId}`);
  },
};
