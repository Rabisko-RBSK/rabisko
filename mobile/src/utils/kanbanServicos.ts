import type { KanbanCardDTO, KanbanColuna } from '../services/api/servicosService';

/**
 * Regras de exibição do Kanban de serviços (ServicosScreen): colunas, textos
 * dos cards e formatação de datas. Sem React para ser testável isoladamente
 * (ver tests/kanbanServicos.test.mjs).
 */

export interface ColunaKanban {
  chave: KanbanColuna;
  titulo: string;
  /** Cor do ponto de status no cabeçalho da coluna. */
  cor: string;
}

export const COLUNAS: ColunaKanban[] = [
  { chave: 'chat_iniciado', titulo: 'Chat iniciado', cor: '#2C4466' },
  { chave: 'agendado', titulo: 'Agendado', cor: '#602C66' },
  { chave: 'em_progresso', titulo: 'Em progresso', cor: '#B5752A' },
  { chave: 'finalizado', titulo: 'Finalizado', cor: '#1F7A4D' },
];

export type IconeMeta = 'mensagem' | 'calendario' | 'concluido';

export interface TextosDoCard {
  /** Pílula ao lado do nome do cliente; null quando não se aplica. */
  etiqueta: string | null;
  icone: IconeMeta;
  meta: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function agruparPorColuna(cards: KanbanCardDTO[]): Record<KanbanColuna, KanbanCardDTO[]> {
  const grupos: Record<KanbanColuna, KanbanCardDTO[]> = {
    chat_iniciado: [], agendado: [], em_progresso: [], finalizado: [],
  };
  for (const card of cards) grupos[card.coluna]?.push(card);
  return grupos;
}

/** "2026-11-05T14:00:00" (horário local, sem fuso) → "Qua, 05/11 · 14:00". */
export function formatarSessao(localIso: string): string {
  const [data, hora = ''] = localIso.split('T');
  const [ano, mes, dia] = data.split('-').map(Number);
  const semana = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()];
  return `${semana}, ${pad(dia)}/${pad(mes)} · ${hora.slice(0, 5)}`;
}

/** "2026-10-28" → "28/10". */
export function formatarDiaMes(data: string): string {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
}

/** Tempo desde a última mensagem: "agora", "há 5 min", "há 2 h", "ontem", "há 3 dias", "em 12/09". */
export function tempoDesde(iso: string, agora: Date = new Date()): string {
  const quando = new Date(iso);
  if (Number.isNaN(quando.getTime())) return '';

  const minutos = Math.floor((agora.getTime() - quando.getTime()) / 60_000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 24 * 60) return `há ${Math.floor(minutos / 60)} h`;

  const dias = diasEntre(quando, agora);
  if (dias <= 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  return `em ${pad(quando.getDate())}/${pad(quando.getMonth() + 1)}`;
}

export function textosDoCard(card: KanbanCardDTO, agora: Date = new Date()): TextosDoCard {
  switch (card.coluna) {
    case 'chat_iniciado':
      return {
        etiqueta: null,
        icone: 'mensagem',
        meta: card.ultimaMensagemEm ? `Última mensagem ${tempoDesde(card.ultimaMensagemEm, agora)}` : 'Chat iniciado',
      };
    case 'agendado':
    case 'em_progresso': {
      const etiqueta = card.totalSessoes === 0 ? null
        : card.totalSessoes === 1 ? 'Sessão única'
        : `Sessão ${card.sessaoAtual ?? 1} de ${card.totalSessoes}`;
      if (!card.proximaSessao) return { etiqueta, icone: 'calendario', meta: 'Sem sessão marcada' };
      const quando = formatarSessao(card.proximaSessao);
      return {
        etiqueta,
        icone: 'calendario',
        meta: card.coluna === 'em_progresso' ? `Próxima sessão · ${quando}` : quando,
      };
    }
    case 'finalizado':
      return {
        etiqueta: card.totalSessoes > 1 ? `${card.totalSessoes} sessões` : 'Sessão única',
        icone: 'concluido',
        meta: card.concluidoEm ? `Concluído em ${formatarDiaMes(card.concluidoEm)}` : 'Concluído',
      };
  }
}

/** "Ana Souza" → "AS"; "Tatuador 1" → "T1"; "Ana" → "A". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Dias de calendário entre duas datas (meia-noite local a meia-noite local). */
function diasEntre(de: Date, ate: Date): number {
  const inicio = new Date(de.getFullYear(), de.getMonth(), de.getDate()).getTime();
  const fim = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate()).getTime();
  return Math.round((fim - inicio) / 86_400_000);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
