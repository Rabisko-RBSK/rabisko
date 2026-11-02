import api from './index';

export type KanbanColuna = 'chat_iniciado' | 'agendado' | 'em_progresso' | 'finalizado';

/**
 * Card do Kanban de serviços. As datas dependem da coluna: `ultimaMensagemEm`
 * (ISO com fuso) em chat_iniciado, `proximaSessao` (horário local, sem fuso)
 * em agendado/em_progresso e `concluidoEm` (YYYY-MM-DD) em finalizado.
 */
export interface KanbanCardDTO {
  coluna: KanbanColuna;
  chatId: string | null;
  /** null em chat_iniciado (ainda não há serviço). */
  servicoId: string | null;
  clienteNome: string;
  tatuadorId: string;
  tatuadorNome: string;
  totalSessoes: number;
  /** Posição (1..totalSessoes) da próxima sessão; null fora de agendado/em_progresso. */
  sessaoAtual: number | null;
  proximaSessao: string | null;
  concluidoEm: string | null;
  ultimaMensagemEm: string | null;
}

/** Kanban de serviços (somente leitura). Os cards já vêm ordenados por coluna. */
export const servicosService = {
  /** Serviços e chats do tatuador logado. */
  async doTatuador(): Promise<KanbanCardDTO[]> {
    const { data } = await api.get<KanbanCardDTO[]>('/artist/me/servicos');
    return data;
  },

  /** Serviços de todos os tatuadores do estúdio logado (ou modo estúdio). */
  async doEstudio(): Promise<KanbanCardDTO[]> {
    const { data } = await api.get<KanbanCardDTO[]>('/studio/me/servicos');
    return data;
  },
};
