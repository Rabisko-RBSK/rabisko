import api from './index';

/**
 * Avaliação recebida por um tatuador. Espelha a tabela `avaliacoes` do banco
 * (avaliacao_id, nota, comentario, data_criacao) acrescida do nome do
 * remetente — que o backend resolve via join em `users`.
 *
 * Mantenha em sync com o DTO quando o endpoint for criado no backend.
 */
export interface Avaliacao {
  avaliacaoId: string;
  remetenteId: string;
  remetenteNome: string;
  /** Nota de 1 a 5 (avaliacoes.nota). */
  nota: number;
  /** Comentário livre — pode vir nulo (avaliacoes.comentario é nullable). */
  comentario: string | null;
  /** ISO-8601 (avaliacoes.data_criacao). */
  dataCriacao: string;
}

export const avaliacaoService = {
  /**
   * Lista as avaliações recebidas por um tatuador (avaliacoes.destinatario_id),
   * da mais recente para a mais antiga.
   *
   * NOTA: o endpoint ainda não existe no backend. Quando o ArtistController
   * expuser `GET /artist/{id}/avaliacoes`, esta camada já está pronta — a tela
   * de perfil consome o resultado sem nenhuma mudança de UI.
   */
  async listarPorTatuador(tatuadorId: string): Promise<Avaliacao[]> {
    const { data } = await api.get<Avaliacao[]>(`/artist/${tatuadorId}/avaliacoes`);
    return data;
  },
};
