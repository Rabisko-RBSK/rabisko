import api from './index';

/** Perfil do cliente logado (GET/PATCH /client/me). */
export interface ClientePerfil {
  nome: string;
  /** Do login (Supabase Auth): só leitura. */
  email: string;
  /** Só dígitos; null sem telefone. */
  telefone: string | null;
  /** "yyyy-MM-dd"; null quando não informado. */
  dataNasc: string | null;
  /** Só leitura. */
  cpf: string | null;
}

export interface AtualizarClienteDTO {
  nome: string;
  telefone: string | null;
  dataNasc: string | null;
}

export const clientService = {
  async meuPerfil(): Promise<ClientePerfil> {
    const { data } = await api.get<ClientePerfil>('/client/me');
    return data;
  },

  async atualizar(dto: AtualizarClienteDTO): Promise<ClientePerfil> {
    const { data } = await api.patch<ClientePerfil>('/client/me', dto);
    return data;
  },
};
