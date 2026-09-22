import api from './index';

/**
 * Imagem do portfólio de um tatuador. Espelha a tabela `portfolio_imagens`
 * do banco (imagem_id, url, descricao, ordem).
 */
export interface PortfolioImage {
  imagemId: string;
  url: string;
  descricao: string | null;
  ordem: number | null;
}

/**
 * Perfil do tatuador logado. Combina, numa única resposta, dados de três
 * tabelas: `users` (nome), `tatuadores` (bio, instagram) e `portfolio_imagens`
 * (galeria).
 *
 * `fotoUrl` é nulo quando o tatuador não enviou foto — a UI cai num avatar
 * anônimo padrão. (Ainda não há coluna de foto no schema; o backend deve
 * retornar null até que exista.)
 */
export interface ArtistProfile {
  tatuadorId: string;
  /** users.nome — o nome informado no cadastro. */
  nome: string;
  /** URL da foto de perfil; null quando o tatuador não tem foto. */
  fotoUrl: string | null;
  /** tatuadores.bio — o "Sobre", informado no cadastro. */
  bio: string | null;
  /** tatuadores.instagram — handle, com ou sem "@". */
  instagram: string | null;
  /**
   * Nível do tatuador (ex.: "Prata"). Reservado — o sistema de níveis ainda
   * não existe no banco; o backend pode omitir e o selo fica oculto.
   */
  tier?: string | null;
  /** Galeria de trabalhos (portfolio_imagens), já ordenada por `ordem`. */
  portfolio: PortfolioImage[];
}

/** Campos editáveis do perfil — semântica PATCH: apenas o que vier é alterado. */
export interface AtualizarPerfilDTO {
  bio?: string | null;
  fotoUrl?: string | null;
}

/**
 * Monta o body multipart para upload de uma imagem local (URI `file://`)
 * em RN. O `as any` é o cast padrão pro tipo do RN, que aceita o objeto
 * `{ uri, name, type }` mas não está expresso na lib `FormData` do DOM.
 */
function multipartImage(uri: string, fieldName: string, descricao?: string): FormData {
  const form = new FormData();
  const nome = uri.split('/').pop() || 'imagem.jpg';
  const ext = nome.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  form.append(fieldName, { uri, name: nome, type: mime } as any);
  if (descricao) form.append('descricao', descricao);
  return form;
}

export const artistService = {
  /**
   * Perfil do tatuador autenticado (identificado pelo JWT).
   *
   * NOTA: o endpoint ainda não existe no backend. Quando o ArtistController
   * expuser `GET /artist/me`, esta camada já está pronta — a tela de perfil
   * consome o resultado sem nenhuma mudança de UI.
   */
  async obterMeuPerfil(): Promise<ArtistProfile> {
    const { data } = await api.get<ArtistProfile>('/artist/me');
    return data;
  },

  /**
   * Atualiza o perfil do tatuador autenticado. Semântica PATCH: só os campos
   * informados são alterados.
   *
   * NOTA: requer `PATCH /artist/me` no backend.
   */
  async atualizarMeuPerfil(dto: AtualizarPerfilDTO): Promise<ArtistProfile> {
    const { data } = await api.patch<ArtistProfile>('/artist/me', dto);
    return data;
  },

  /**
   * Envia uma nova foto de perfil (multipart) e devolve a URL armazenada.
   * Depois do upload, chame `atualizarMeuPerfil({ fotoUrl })` pra gravar
   * a URL no perfil — ou ajuste o backend pra fazer as duas coisas num
   * endpoint só.
   *
   * NOTA: requer `POST /artist/me/foto` no backend (multipart, campo `file`,
   * resposta `{ url: string }`).
   */
  async enviarFotoPerfil(localUri: string): Promise<string> {
    const form = multipartImage(localUri, 'file');
    const { data } = await api.post<{ url: string }>('/artist/me/foto', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },

  /**
   * Adiciona uma imagem ao portfólio (multipart). Devolve a imagem persistida.
   *
   * NOTA: requer `POST /artist/me/portfolio` no backend (multipart, campo
   * `file` + opcional `descricao`, resposta `PortfolioImage`).
   */
  async adicionarImagemPortfolio(
    localUri: string,
    descricao?: string,
  ): Promise<PortfolioImage> {
    const form = multipartImage(localUri, 'file', descricao);
    const { data } = await api.post<PortfolioImage>('/artist/me/portfolio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Remove uma imagem do portfólio pelo id.
   *
   * NOTA: requer `DELETE /artist/me/portfolio/{imagemId}` no backend.
   */
  async removerImagemPortfolio(imagemId: string): Promise<void> {
    await api.delete(`/artist/me/portfolio/${imagemId}`);
  },
};
