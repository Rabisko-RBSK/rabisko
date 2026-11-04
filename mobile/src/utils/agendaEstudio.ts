import type { ReservaPosicaoDTO } from '../services/api';

/**
 * Regras da tela de posições do estúdio (gráfico de Gantt ao agendar).
 * Espelha o ValidadorAgenda do backend — o backend revalida tudo; aqui é só
 * para o tatuador ver na hora se o horário escolhido está livre.
 *
 * Minutos são contados a partir de 00:00 do dia exibido; sessões que começam
 * no dia anterior e ainda estão em andamento ficam com início negativo.
 */

/** O dia inteiro (00:00 às 24:00); fora do horário do estúdio fica escurecido. */
export const INICIO_GRADE_MIN = 0;
/** Até a meia-noite: uma sessão pode começar às 23:00 e terminar às 24:00. */
export const FIM_GRADE_MIN = 24 * 60;
export const PASSO_MIN = 30;

export interface BlocoAgenda {
  posicao: number | null;
  inicioMin: number;
  duracaoMin: number;
  /** Sessão do próprio tatuador (inclui as pendentes desta proposta). */
  propria: boolean;
  rotulo: string;
  /** Sessão ainda não enviada, de outra parte da mesma proposta. */
  pendente?: boolean;
}

/** Faixa do dia em minutos, [inicio, fim). */
export interface FaixaMin {
  inicio: number;
  fim: number;
}

export const FORA_DO_HORARIO = 'Fora do horário de atendimento do estúdio.';

/**
 * Faixas do dia em que o estúdio não atende: o complemento dos intervalos
 * abertos dentro de 00:00–24:00. `abertas` null = estúdio sem grade (sem
 * restrição); lista vazia = não atende neste dia (o dia todo fechado).
 */
export function faixasFechadas(abertas: FaixaMin[] | null): FaixaMin[] {
  if (abertas === null) return [];
  const fechadas: FaixaMin[] = [];
  let cursor = 0;
  for (const a of [...abertas].sort((x, y) => x.inicio - y.inicio)) {
    if (a.inicio > cursor) fechadas.push({ inicio: cursor, fim: a.inicio });
    cursor = Math.max(cursor, a.fim);
  }
  if (cursor < 24 * 60) fechadas.push({ inicio: cursor, fim: 24 * 60 });
  return fechadas;
}

export interface Candidato {
  posicao: number;
  inicioMin: number;
  duracaoMin: number;
}

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function paraHorario(min: number): string {
  // 24:00 (fim de uma sessão que termina à meia-noite) aparece como 00:00.
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Intervalos [inicio, fim): encostar no fim do outro não é sobreposição. */
export function sobrepoe(aIni: number, aDur: number, bIni: number, bDur: number): boolean {
  return aIni < bIni + bDur && bIni < aIni + aDur;
}

/** Diferença em dias entre duas datas ISO (YYYY-MM-DD), sem fuso. */
function diasEntre(de: string, ate: string): number {
  const [y1, m1, d1] = de.split('-').map(Number);
  const [y2, m2, d2] = ate.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Converte as reservas da API em blocos relativos ao dia `data`. */
export function blocosDoDia(reservas: ReservaPosicaoDTO[], data: string): BlocoAgenda[] {
  return reservas.map((r) => ({
    posicao: r.posicao,
    inicioMin: paraMinutos(r.horario) - diasEntre(r.data, data) * 24 * 60,
    duracaoMin: r.duracaoMinutos,
    propria: r.propria,
    rotulo: r.propria ? 'Você' : primeiroNome(r.tatuadorNome),
  }));
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || 'Tatuador';
}

/**
 * Motivo do conflito do candidato com os blocos já ocupados, ou null se o
 * horário está livre. Mesma ordem de regras do backend: posição ocupada
 * primeiro, depois a agenda do próprio tatuador.
 */
export function motivoConflito(
  candidato: Candidato,
  blocos: BlocoAgenda[],
  /** Minuto atual quando o dia exibido é hoje (ver minutosAgoraSeHoje). */
  agoraMin: number | null = null,
  /**
   * Intervalos em que o estúdio atende no dia; null = sem restrição. A sessão
   * inteira precisa caber num deles (mesma regra do HorarioService do backend).
   */
  abertas: FaixaMin[] | null = null,
): string | null {
  if (agoraMin !== null && candidato.inicioMin <= agoraMin) {
    return 'Esse horário já passou.';
  }
  const fim = candidato.inicioMin + candidato.duracaoMin;
  if (abertas !== null && !abertas.some((a) => candidato.inicioMin >= a.inicio && fim <= a.fim)) {
    return FORA_DO_HORARIO;
  }
  for (const b of blocos) {
    if (!sobrepoe(candidato.inicioMin, candidato.duracaoMin, b.inicioMin, b.duracaoMin)) continue;
    const periodo = `das ${paraHorario(Math.max(b.inicioMin, 0))} às ${paraHorario(b.inicioMin + b.duracaoMin)}`;
    if (b.posicao === candidato.posicao) {
      return `A posição ${candidato.posicao} já está ocupada ${periodo}.`;
    }
    if (b.propria) {
      return b.pendente
        ? `Outra sessão desta proposta já ocupa ${periodo}.`
        : `Você já tem uma sessão ${periodo}.`;
    }
  }
  return null;
}

/**
 * Minuto atual (desde 00:00) se `data` é hoje no relógio do aparelho; null
 * para outros dias. O backend recusa sessões que começam até "agora".
 */
export function minutosAgoraSeHoje(data: Date, agora: Date = new Date()): number | null {
  if (data.toDateString() !== agora.toDateString()) return null;
  return agora.getHours() * 60 + agora.getMinutes();
}

/** Arredonda o minuto tocado para o passo da grade, dentro do horário exibido. */
export function encaixarNoPasso(minuto: number, duracaoMin: number): number {
  const passo = Math.floor(minuto / PASSO_MIN) * PASSO_MIN;
  const maxInicio = FIM_GRADE_MIN - duracaoMin;
  return Math.min(Math.max(passo, INICIO_GRADE_MIN), Math.max(maxInicio, INICIO_GRADE_MIN));
}
