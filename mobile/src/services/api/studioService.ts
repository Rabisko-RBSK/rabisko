import api from './index';
import { ConviteDTO, ConviteDetalheDTO, ContratoDTO, ContratoInput } from './artistService';

/** Tatuador da equipe do estúdio (GET /studio/me/colaboradores). */
export interface ColaboradorDTO {
  tatuadorId: string;
  nome: string;
  fotoPerfilUrl: string | null;
  instagram: string | null;
  contratoAtivo: ContratoDTO | null;
  contratoProposto: ContratoDTO | null;
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

/** Perfil do estúdio logado (GET/PATCH /studio/me). */
export interface StudioDTO {
  estudioId: string;
  nome: string;
  email: string;
  cnpj: string | null;
  telefone: string | null;
  enderecoId: string | null;
  fotoPerfilUrl: string | null;
  /** Posições (macas/bancadas) de atendimento, de 1 a 50. */
  posicoes: number;
}

/** Rotas `/studio/**` — exigem role ESTUDIO no backend. */
export const studioService = {
  async meuEstudio(): Promise<StudioDTO> {
    const { data } = await api.get<StudioDTO>('/studio/me');
    return data;
  },

  /** 409 se houver sessões futuras em posições que deixariam de existir. */
  async atualizarPosicoes(posicoes: number): Promise<StudioDTO> {
    const { data } = await api.patch<StudioDTO>('/studio/me', { posicoes });
    return data;
  },

  /** `termo` casa com nome, e-mail ou instagram; mínimo de 2 caracteres. */
  async buscarTatuadores(termo: string): Promise<TatuadorBuscaDTO[]> {
    const { data } = await api.get<TatuadorBuscaDTO[]>('/studio/tatuadores', {
      params: { termo },
    });
    return data;
  },

  async convidarTatuador(tatuadorId: string, contrato: ContratoInput): Promise<ConviteDTO> {
    const { data } = await api.post<ConviteDTO>('/studio/me/convites', { tatuadorId, contrato });
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

  /** Todos os contratos com o colaborador, do mais recente ao mais antigo. */
  async historicoContratos(tatuadorId: string): Promise<ContratoDTO[]> {
    const { data } = await api.get<ContratoDTO[]>(`/studio/me/colaboradores/${tatuadorId}/contratos`);
    return data;
  },

  /** Renegociação: o contrato atual continua valendo até o tatuador aceitar. */
  async proporContrato(tatuadorId: string, contrato: ContratoInput): Promise<ContratoDTO> {
    const { data } = await api.post<ContratoDTO>(`/studio/me/colaboradores/${tatuadorId}/contratos`, contrato);
    return data;
  },

  async cancelarPropostaContrato(tatuadorId: string): Promise<ContratoDTO> {
    const { data } = await api.delete<ContratoDTO>(`/studio/me/colaboradores/${tatuadorId}/contratos/proposta`);
    return data;
  },
};
