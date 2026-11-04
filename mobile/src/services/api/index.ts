import axios from 'axios';
import { supabase } from '../supabase';
import { multipartImage } from '../../utils/multipart';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Token do Supabase Auth. getSession() devolve a sessão já renovada quando o
// access_token venceu (ex.: app voltando do segundo plano).
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterClienteData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  dataNasc?: string;
  cpf: string;
  termosAceitos: boolean;
}

export interface RegisterArtistaData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  dataNasc?: string;
  cpf: string;
  bio?: string;
  instagram?: string;
  /** Estúdio próprio (solo): cria o estúdio e o contrato "dono" junto com a conta. */
  estudioSolo?: EstudioSoloInput;
  termosAceitos: boolean;
}

export interface EstudioSoloInput {
  nome: string;
  /** Conferido na Receita Federal pelo backend (ativo + CNAE 9609-2/06). */
  cnpj: string;
  endereco: EnderecoInput;
}

export interface EnderecoInput {
  cep: string;
  logradouro: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  latitude?: number;
  longitude?: number;
}

export interface RegisterEstudioData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  /** Conferido na Receita Federal pelo backend (ativo + CNAE 9609-2/06). */
  cnpj: string;
  /** Quantidade de posições (macas/bancadas) de atendimento, de 1 a 50. */
  posicoes: number;
  endereco: EnderecoInput;
  termosAceitos: boolean;
}

export interface UserMeResponse {
  userId: string;
  nome: string;
  email: string;
  telefone?: string;
  dataNasc?: string;
  role: 'admin' | 'cliente' | 'tatuador' | 'estudio';
  /** Estúdio próprio do tatuador (contrato "dono"); null nos demais casos. */
  estudioProprioId: string | null;
}

export interface ChatDTO {
  chatId: string;
  outroUsuarioId: string;
  outroUsuarioNome: string;
  ultimaMensagem: string | null;
  dataUltimaMensagem: string | null;
  ativo: boolean;
  /** A última mensagem é para o usuário logado e ainda não foi lida. */
  naoLida: boolean;
}

export interface MensagemDTO {
  mensagemId: string;
  chatId: string;
  remetenteId: string;
  destinatarioId: string;
  /** Texto, ou legenda quando há imagem. Null em imagem sem legenda. */
  conteudo: string | null;
  imagemUrl: string | null;
  dataEnvio: string;
}

export interface Page<T> {
  content: T[];
  number: number;    
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/**
 * Cadastro e perfil. O login em si é feito no Supabase Auth (services/supabase.ts):
 * o cadastro cria a conta e o perfil e responde 201 sem token — a tela entra
 * com o mesmo e-mail e senha logo depois.
 */
export const authService = {
  async registerCliente(data: RegisterClienteData): Promise<void> {
    await api.post('/user/cadastro/cliente', data);
  },
  async registerArtista(data: RegisterArtistaData): Promise<void> {
    await api.post('/user/cadastro/artista', data);
  },
  async registerEstudio(data: RegisterEstudioData): Promise<void> {
    await api.post('/user/cadastro/estudio', data);
  },

  async me(): Promise<UserMeResponse> {
    const { data } = await api.get<UserMeResponse>('/user/me');
    return data;
  }
};

export const chatService = {
  async abrirChat(outroPerfilId: string): Promise<ChatDTO> {
    const { data } = await api.post<ChatDTO>('/chats', { outroPerfilId });
    return data;
  },

  async listarChats(): Promise<ChatDTO[]> {
    const { data } = await api.get<ChatDTO[]>('/chats');
    return data;
  },

  async listarMensagens(chatId: string, page = 0, size = 30): Promise<Page<MensagemDTO>> {
    const { data } = await api.get<Page<MensagemDTO>>(
      `/chats/${chatId}/mensagens`,
      { params: { page, size } }
    );
    return data;
  },

  /** Marca a conversa como lida até agora (alimenta "Mensagens não lidas" do Kanban). */
  async marcarComoLido(chatId: string): Promise<void> {
    await api.post(`/chats/${chatId}/leitura`);
  },

  /**
   * Envia uma imagem local (`file://`) no chat, com legenda opcional.
   * A mensagem criada também chega pelo WebSocket (/user/queue/messages).
   */
  async enviarImagem(chatId: string, localUri: string, legenda?: string): Promise<MensagemDTO> {
    const form = multipartImage(localUri, 'file', { legenda });
    const { data } = await api.post<MensagemDTO>(`/chats/${chatId}/imagens`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Upload em rede móvel passa fácil dos 10s padrão.
      timeout: 60000,
    });
    return data;
  },
}


export interface AppointmentSessionInput {
  data: string;
  horario: string;
  duracaoMinutos: number;
  /** Posição do estúdio; o backend usa 1 quando o estúdio só tem uma. */
  posicao?: number;
}

export interface AppointmentSessionDTO {
  sessionId: string;
  data: string;
  horario: string;
  duracaoMinutos: number;
  posicao: number | null;
  status: string;
  /** Futura e não marcada: o tatuador pode remarcar ou remover. */
  editavel: boolean;
}

/** Sessão já reservada no estúdio (gráfico de posições). */
export interface ReservaPosicaoDTO {
  sessionId: string;
  /** null em sessões antigas, sem posição. */
  posicao: number | null;
  data: string;
  horario: string;
  duracaoMinutos: number;
  tatuadorNome: string;
  /** true quando a sessão é do tatuador logado. */
  propria: boolean;
}

export interface AgendaEstudioDTO {
  vinculadoEstudio: boolean;
  estudioId: string | null;
  nomeEstudio: string | null;
  posicoes: number;
  data: string;
  reservas: ReservaPosicaoDTO[];
}

export interface AppointmentDTO {
  appointmentId: string;
  chatId: string;
  clienteId: string;
  tatuadorId: string;
  clienteNome: string | null;
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada' | 'no_show';
  finalizado: boolean;
  valorTotal: number;
  /** Sessões não canceladas, em ordem de data. */
  sessoes: AppointmentSessionDTO[];
  dataCriacao: string;
}

export interface SessaoEditadaInput extends AppointmentSessionInput {
  /** null = sessão nova. */
  sessionId: string | null;
}

export interface EditarServicoDTO {
  valorTotal: number;
  sessoes: SessaoEditadaInput[];
}

export interface BusySlotDTO {
  horario: string;
  duracaoMinutos: number;
}

export interface SessaoListItemDTO {
  sessionId: string;
  appointmentId: string;
  data: string;
  horario: string;
  duracaoMinutos: number;
  outroNome: string;
  outroFotoUrl: string | null;
  valorTotal: number;
  status: string;
}

/** Token do QR code de check-in da sessão. */
export interface TokenCheckin {
  token: string;
  /** ISO-8601, em UTC. */
  expiraEm: string;
}

/** Status que o tatuador pode marcar numa sessão que já aconteceu. */
export type StatusSessaoMarcavel = 'concluida' | 'no_show';

export const appointmentService = {
  async criar(data: {
    chatId: string;
    estiloId: string;
    sessoes: AppointmentSessionInput[];
    valorTotal: number;
  }): Promise<AppointmentDTO> {
    const { data: res } = await api.post<AppointmentDTO>('/appointments', data);
    return res;
  },

  async obter(id: string): Promise<AppointmentDTO> {
    const { data: res } = await api.get<AppointmentDTO>(`/appointments/${id}`);
    return res;
  },

  /**
   * Tatuador edita o serviço: valor total e o conjunto desejado das sessões
   * editáveis (com `sessionId` = remarcar; sem = nova; omitida = cancelada).
   * O cliente recebe a grade atualizada no chat.
   */
  async editar(id: string, dto: EditarServicoDTO): Promise<AppointmentDTO> {
    const { data: res } = await api.put<AppointmentDTO>(`/appointments/${id}`, dto);
    return res;
  },

  async busySlots(date: string): Promise<BusySlotDTO[]> {
    const { data: res } = await api.get<BusySlotDTO[]>('/appointments/busy-slots', {
      params: { date },
    });
    return res;
  },

  async listarSessoes(params?: { de?: string; ate?: string }): Promise<SessaoListItemDTO[]> {
    const { data: res } = await api.get<SessaoListItemDTO[]>('/appointments/minhas-sessoes', { params });
    return res;
  },

  /**
   * O tatuador marca a sessão como realizada ou falta do cliente, depois do
   * horário dela. Só sessões realizadas entram na comissão do estúdio.
   */
  async marcarSessao(sessionId: string, status: StatusSessaoMarcavel): Promise<void> {
    await api.patch(`/appointments/sessoes/${sessionId}/status`, { status });
  },

  /**
   * Cliente: token do QR da sessão (vale 2 minutos; peça outro antes de vencer).
   * Só de 30 min antes a 6 h depois do início.
   */
  async qrCodeSessao(sessionId: string): Promise<TokenCheckin> {
    const { data } = await api.get<TokenCheckin>(`/appointments/sessoes/${sessionId}/qrcode`);
    return data;
  },

  /** Tatuador: leu o QR do cliente; a sessão vira realizada. */
  async checkIn(token: string): Promise<void> {
    await api.post('/appointments/sessoes/check-in', { token });
  },

  /** Posições do estúdio do tatuador logado e as reservas do dia. */
  async agendaEstudio(date: string): Promise<AgendaEstudioDTO> {
    const { data: res } = await api.get<AgendaEstudioDTO>('/appointments/agenda-estudio', {
      params: { date },
    });
    return res;
  },
};

export default api;
