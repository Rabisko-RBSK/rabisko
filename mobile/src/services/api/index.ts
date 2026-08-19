import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

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
  cpf?: string;
  bio?: string;
  instagram?: string;
  endereco?: string;
  estilos?: string[];
  termosAceitos: boolean;
}

export interface RegisterEstudioData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cnpj?: string;
  endereco?: string;
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
  conteudo: string;
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
  }
}


export interface AppointmentSessionInput {
  data: string;
  horario: string;
  duracaoMinutos: number;
}

export interface AppointmentSessionDTO {
  sessionId: string;
  data: string;
  horario: string;
  duracaoMinutos: number;
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
};

export default api;
