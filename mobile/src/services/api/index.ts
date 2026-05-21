import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Lê o token direto do authStore (Zustand). Antes lia de uma chave
// separada `rabisko:token` no AsyncStorage que nunca era escrita —
// o authStore.persist já guarda tudo em 'auth-storage'. Uma fonte só
// de verdade evita o bug "logado mas request autenticada falha 401".
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
  // endereço só é relevante quando o tatuador é autônomo (sem estudio_id);
  // quando vinculado a estúdio, o front pode omitir.
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

export default api;
