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
  { chave: 'mensagens_nao_lidas', titulo: 'Mensagens não lidas', cor: '#2C4466' },
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
    mensagens_nao_lidas: [], agendado: [], em_progresso: [], finalizado: [],
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

/** Há quanto tempo o cliente espera: "menos de 1 min", "20 min", "2 h", "1 dia", "3 dias". */
export function tempoDeEspera(iso: string, agora: Date = new Date()): string {
  const desde = new Date(iso);
  if (Number.isNaN(desde.getTime())) return '';

  const minutos = Math.floor((agora.getTime() - desde.getTime()) / 60_000);
  if (minutos < 1) return 'menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

export function textosDoCard(card: KanbanCardDTO, agora: Date = new Date()): TextosDoCard {
  switch (card.coluna) {
    case 'mensagens_nao_lidas': {
      const n = card.naoLidas ?? 0;
      return {
        etiqueta: `${n} ${n === 1 ? 'não lida' : 'não lidas'}`,
        icone: 'mensagem',
        meta: card.aguardandoDesde ? `Sem resposta há ${tempoDeEspera(card.aguardandoDesde, agora)}` : 'Sem resposta',
      };
    }
    case 'agendado':
    case 'em_progresso': {
      // Todas as sessões já passaram e o tatuador ainda não finalizou.
      if (card.coluna === 'em_progresso' && card.sessaoAtual === null && card.totalSessoes > 0) {
        return { etiqueta: 'Aguardando finalização', icone: 'concluido', meta: 'Todas as sessões concluídas' };
      }
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

/** O que acontece ao tocar no card; null quando o card não tem ação. */
export type AcaoDoCard = 'abrir_chat' | 'abrir_servico' | 'detalhes_sessao';

/**
 * Mensagens não lidas: só o tatuador abre o chat (o estúdio não participa da
 * conversa). Demais colunas: o tatuador abre a tela do serviço (editar,
 * sessões, QR, finalizar); o estúdio vê os detalhes da sessão de referência.
 */
export function acaoDoCard(card: KanbanCardDTO, visao: 'tatuador' | 'estudio'): AcaoDoCard | null {
  if (card.coluna === 'mensagens_nao_lidas') {
    return visao === 'tatuador' && card.chatId && card.clienteAuthId ? 'abrir_chat' : null;
  }
  if (visao === 'tatuador' && card.servicoId) return 'abrir_servico';
  return card.sessao ? 'detalhes_sessao' : null;
}

/** "Ana Souza" → "AS"; "Tatuador 1" → "T1"; "Ana" → "A". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
