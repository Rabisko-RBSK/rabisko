import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { multipartImage } from '../../utils/multipart';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginData {
  login: string;
  senha: string;
}

export interface RegisterClienteData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  dataNasc?: string;
  cpf?: string;
  termosAceitos: boolean;
}

export interface RegisterArtistaData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  dataNasc?: string;
  cnpj?: string;
  bio?: string;
  instagram?: string;
  endereco: EnderecoInput;
  estilos?: string[];
  termosAceitos: boolean;
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
  cnpj?: string;
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
}

export interface ChatDTO {
  chatId: string;
  outroUsuarioId: string;
  outroUsuarioNome: string;
  ultimaMensagem: string | null;
  dataUltimaMensagem: string | null;
  ativo: boolean;
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

export interface AuthResponse {
  token: string;
}

export const authService = {
  
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async registerCliente(data: RegisterClienteData): Promise<AuthResponse> {
    const { data: res } = await api.post<AuthResponse>('/user/cadastro/cliente', data);
    return res;
  },
  async registerArtista(data: RegisterArtistaData): Promise<AuthResponse> {
    const { data: res } = await api.post<AuthResponse>('/user/cadastro/artista', data);
    return res;
  },
  async registerEstudio(data: RegisterEstudioData): Promise<AuthResponse> {
    const { data: res } = await api.post<AuthResponse>('/user/cadastro/estudio', data);
    return res;
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
  /** Obrigatória quando o tatuador é vinculado a um estúdio. */
  posicao?: number;
}

export interface AppointmentSessionDTO {
  sessionId: string;
  data: string;
  horario: string;
  duracaoMinutos: number;
  posicao: number | null;
}

/** Sessão já reservada no estúdio (gráfico de posições). */
export interface ReservaPosicaoDTO {
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
  status: 'agendada' | 'confirmada' | 'em_andamento' | 'concluida' | 'cancelada' | 'no_show';
  valorTotal: number;
  sessoes: AppointmentSessionDTO[];
  dataCriacao: string;
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

export const appointmentService = {
  async criar(data: {
    chatId: string;
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

  /** Posições do estúdio do tatuador logado e as reservas do dia. */
  async agendaEstudio(date: string): Promise<AgendaEstudioDTO> {
    const { data: res } = await api.get<AgendaEstudioDTO>('/appointments/agenda-estudio', {
      params: { date },
    });
    return res;
  },
};

export default api;
