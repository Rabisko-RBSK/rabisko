import api from './index';

export interface FlashItem {
  id: string;
  title: string;
  price: string | number;
  photo: string;
  description?: string;
  tatuadorId?: string;
  tatuadorNome?: string;
}

export const flashService = {
  /**
   * Busca flashes do dia.
   * Contrato proposto: GET /flashes/hoje -> FlashItem[]
   */
  async listarFlashesDoDia(): Promise<FlashItem[]> {
    try {
      const { data } = await api.get<FlashItem[]>('/flashes/hoje');
      return data;
    } catch {
      // Quando o backend não disponibiliza o endpoint /flashes/hoje,
      // retorna lista vazia para tratar de forma segura o empty state.
      return [];
    }
  },

  /**
   * Busca detalhes de um flash específico.
   * Contrato proposto: GET /flashes/{id} -> FlashItem
   */
  async obterDetalhes(id: string): Promise<FlashItem | null> {
    try {
      const { data } = await api.get<FlashItem>(`/flashes/${id}`);
      return data;
    } catch {
      return null;
    }
  },
};
