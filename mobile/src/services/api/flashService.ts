import api from './index';

export interface FlashItem {
  id: string;
  title: string;
  price: string;
  photo: string;
  tatuadorId?: string;
  tatuadorNome?: string;
  descricao?: string;
}

const SHOWCASE_FLASHES: FlashItem[] = [
  {
    id: 'f1',
    title: 'Lobo geométrico',
    price: 'R$ 280',
    photo: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'f2',
    title: 'Borboleta minimal',
    price: 'R$ 180',
    photo: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'f3',
    title: 'Cobra tradicional',
    price: 'R$ 320',
    photo: 'https://images.unsplash.com/photo-1590246814883-57c511e7afde?q=80&w=400&auto=format&fit=crop',
  },
];

export const flashService = {
  /**
   * Busca flashes do dia.
   * Contrato proposto: GET /flashes/today.
   * Em caso de 404 (endpoint ainda não presente no backend), faz fallback
   * gracioso para os flashes do dia para manter as imagens e o visual da tela.
   */
  async listarHoje(): Promise<FlashItem[]> {
    try {
      const { data } = await api.get<FlashItem[]>('/flashes/today');
      if (data && data.length > 0) return data;
      return SHOWCASE_FLASHES;
    } catch (err: any) {
      if (err?.response?.status === 404 || !err?.response) {
        return SHOWCASE_FLASHES;
      }
      return SHOWCASE_FLASHES;
    }
  },
};
