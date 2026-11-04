import api, { type EstudioSoloInput } from './index';
import type { StudioDTO } from './studioService';
import { multipartImage } from '../../utils/multipart';

/**
 * Imagem do portfólio de um tatuador. Espelha a tabela `portfolio_imagens`
 * do banco (imagem_id, url, descricao, ordem).
 */
export interface PortfolioImage {
  imagemId: string;
  url: string;
  /** Estilo do trabalho (obrigatório no upload); define os estilos do tatuador na busca. */
  estiloId: string | null;
  descricao?: string | null;
  ordem?: number | null;
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
  /** Selo de nível (Bronze/Prata/Ouro); o backend ainda manda sempre null. */
  tier: string | null;

  /**
   * Estúdio onde o tatuador atende: o do contrato de colaborador ativo ou, sem
   * ele, o estúdio próprio. null = sem estúdio (não atende).
   */
  estudioId: string | null;
  /** estudios.nome — null quando não atende em estúdio. */
  nomeEstudio: string | null;
  /** estudios.foto_perfil_url — null sem estúdio ou quando o estúdio não tem foto. */
  fotoEstudioUrl: string | null;

  /** Galeria de trabalhos (portfolio_imagens), já ordenada por `ordem`. */
  portfolio: PortfolioImage[];

  /** users.telefone — só dígitos (10 ou 11); null quando não informado. */
  telefone: string | null;
  /** Endereço próprio do tatuador (não o do estúdio); null quando não cadastrado. */
  endereco: EnderecoDTO | null;
}

/**
 * Um intervalo de atendimento do estúdio. diaSemana: 1 = segunda ... 7 = domingo.
 * Horários em "HH:mm" (o backend pode devolver "HH:mm:ss"; use normalizarHora).
 */
export interface HorarioDTO {
  diaSemana: number;
  abre: string;
  fecha: string;
}

/** Endereço como o backend devolve: campos opcionais vêm null. */
export interface EnderecoDTO {
  cep: string;
  logradouro: string;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
}

/** Campos editáveis do perfil — semântica PATCH: apenas o que vier é alterado. */
export interface AtualizarPerfilDTO {
  bio?: string | null;
  fotoUrl?: string | null;
  nome?: string;
  /** Com ou sem máscara; null ou "" remove. */
  telefone?: string | null;
  /** Com ou sem "@"; null ou "" remove. */
  instagram?: string | null;
}

export type ConviteStatus = 'pendente' | 'aceito' | 'recusado' | 'cancelado';

export interface ConviteDTO {
  conviteId: string;
  estudioId: string;
  tatuadorId: string;
  status: ConviteStatus;
  dataCriacao: string;
  dataResposta: string | null;
}

export interface ConviteDetalheDTO {
  conviteId: string;
  status: ConviteStatus;
  dataCriacao: string;
  estudioId: string;
  nomeEstudio: string;
  fotoEstudioUrl: string | null;
  tatuadorId: string;
  nomeTatuador: string;
  fotoTatuadorUrl: string | null;
  contrato: ContratoDTO | null;
}

/** "dono" é o estúdio próprio do tatuador: não tem valores e não é proposto pelo app. */
export type ContratoModelo = 'comissao' | 'aluguel' | 'salario' | 'dono';

/** Modelos que um estúdio pode propor a um colaborador. */
export type ModeloProposto = Exclude<ContratoModelo, 'dono'>;

export type ContratoPeriodicidade = 'diaria' | 'semanal' | 'mensal';

export type ContratoStatus = 'proposto' | 'ativo' | 'recusado' | 'cancelado' | 'encerrado';

export interface ContratoInput {
  modelo: ModeloProposto;
  percentualEstudio?: number;
  valorFixo?: number;
  periodicidade?: ContratoPeriodicidade;
  observacoes?: string;
}

export interface ContratoDTO {
  contratoId: string;
  estudioId: string;
  tatuadorId: string;
  conviteId: string | null;
  modelo: ContratoModelo;
  percentualEstudio: number | null;
  valorFixo: number | null;
  periodicidade: ContratoPeriodicidade | null;
  observacoes: string | null;
  status: ContratoStatus;
  dataCriacao: string;
  dataResposta: string | null;
  dataEncerramento: string | null;
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
   * Grade do estúdio onde o tatuador atende (perfil público e agendamento).
   * Lista vazia = sem restrição, ou tatuador sem estúdio.
   */
  async horariosDoTatuador(tatuadorId: string): Promise<HorarioDTO[]> {
    const { data } = await api.get<HorarioDTO[]>(`/artist/${tatuadorId}/horarios`);
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
    estiloId: string,
    descricao?: string,
  ): Promise<PortfolioImage> {
    const form = multipartImage(localUri, 'file', { estiloId, descricao });
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

  async aceitarConvite(conviteId: string): Promise<ConviteDTO> {
    const { data } = await api.post<ConviteDTO>(`/artist/me/convites/${conviteId}/aceitar`);
    return data;
  },

  async recusarConvite(conviteId: string): Promise<ConviteDTO> {
    const { data } = await api.post<ConviteDTO>(`/artist/me/convites/${conviteId}/recusar`);
    return data;
  },

  /**
   * Abre o estúdio próprio (contrato "dono") depois do cadastro. 409 se já
   * tiver estúdio próprio ou o CNPJ já for de outro estúdio; 400 com o motivo
   * (em `message`) se a Receita recusar o CNPJ.
   */
  async criarEstudioProprio(dados: EstudioSoloInput): Promise<StudioDTO> {
    const { data } = await api.post<StudioDTO>('/artist/me/estudio', dados);
    return data;
  },

  async sairEstudio(): Promise<void> {
    await api.delete<void>(`/artist/me/estudio`);
  },

  async listarConvites(): Promise<ConviteDetalheDTO[]> {
    const { data } = await api.get<ConviteDetalheDTO[]>(`/artist/me/convites`);
    return data;
  },

  /** Todos os contratos do tatuador (qualquer estúdio/status), do mais recente ao mais antigo. */
  async listarContratos(): Promise<ContratoDTO[]> {
    const { data } = await api.get<ContratoDTO[]>(`/artist/me/contratos`);
    return data;
  },

  /** Aceita a renegociação: o contrato atual é encerrado e o proposto vira ativo. */
  async aceitarPropostaContrato(): Promise<ContratoDTO> {
    const { data } = await api.post<ContratoDTO>(`/artist/me/contratos/proposta/aceitar`);
    return data;
  },

  async recusarPropostaContrato(): Promise<ContratoDTO> {
    const { data } = await api.post<ContratoDTO>(`/artist/me/contratos/proposta/recusar`);
    return data;
  },
};
