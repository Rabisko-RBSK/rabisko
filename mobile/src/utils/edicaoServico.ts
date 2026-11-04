import type { AppointmentSessionDTO, EditarServicoDTO } from '../services/api';

/**
 * Sessão na tela do serviço. As travadas (já aconteceram ou foram marcadas)
 * só aparecem; as editáveis podem ser remarcadas ou removidas; as novas
 * ainda não existem no backend (`sessionId` null).
 */
export interface SessaoEmEdicao {
  /** Estável na lista (id da sessão, ou gerado para as novas). */
  chave: string;
  sessionId: string | null;
  /** "yyyy-MM-dd". */
  data: string;
  /** "HH:mm". */
  horario: string;
  duracaoMinutos: number;
  posicao: number | null;
  status: string;
  editavel: boolean;
}

export function sessoesDoServico(sessoes: AppointmentSessionDTO[]): SessaoEmEdicao[] {
  return sessoes.map((s) => ({
    chave: s.sessionId,
    sessionId: s.sessionId,
    data: s.data,
    horario: s.horario.slice(0, 5),
    duracaoMinutos: s.duracaoMinutos,
    posicao: s.posicao,
    status: s.status,
    editavel: s.editavel,
  }));
}

/** Ordem de exibição: por data e horário. */
export function ordenarSessoes(sessoes: SessaoEmEdicao[]): SessaoEmEdicao[] {
  return [...sessoes].sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`));
}

/** Corpo do PUT: só as editáveis (as travadas não mudam e não vão no pedido). */
export function montarPedido(sessoes: SessaoEmEdicao[], valorTotal: number): EditarServicoDTO {
  return {
    valorTotal,
    sessoes: sessoes
      .filter((s) => s.editavel)
      .map((s) => ({
        sessionId: s.sessionId,
        data: s.data,
        horario: s.horario,
        duracaoMinutos: s.duracaoMinutos,
        posicao: s.posicao ?? undefined,
      })),
  };
}

function assinatura(s: SessaoEmEdicao): string {
  return [s.sessionId, s.data, s.horario, s.duracaoMinutos, s.posicao].join('|');
}

/** Algo mudou em relação ao que veio do backend (habilita "Salvar alterações"). */
export function houveMudanca(
  original: SessaoEmEdicao[],
  atual: SessaoEmEdicao[],
  valorOriginal: number,
  valorAtual: number,
): boolean {
  if (valorOriginal !== valorAtual) return true;
  const a = original.map(assinatura).sort();
  const b = atual.map(assinatura).sort();
  return a.length !== b.length || a.some((x, i) => x !== b[i]);
}

/** "R$ 1.500" digitado → 1500; vazio ou inválido → NaN. */
export function parseValor(texto: string): number {
  return parseFloat(texto.replace(/\./g, '').replace(',', '.'));
}

/** Máscara do valor (reais inteiros, com separador de milhar). */
export function formatarValor(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('pt-BR');
}
