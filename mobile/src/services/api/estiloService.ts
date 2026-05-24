import api from './index';

/** Bate 1:1 com EstiloDTO no backend (GET /estilos). */
export interface Estilo {
  estiloId: string;
  nome: string;
}

export const estiloService = {
  async listar(): Promise<Estilo[]> {
    const { data } = await api.get<Estilo[]>('/estilos');
    return data;
  },
};
