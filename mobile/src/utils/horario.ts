import type { HorarioDTO } from '../services/api/artistService';

/** Índice = diaSemana (1 = segunda ... 7 = domingo; posição 0 sem uso). */
export const DIAS_CURTOS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DIAS_LONGOS = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/** Date (getDay: 0 = domingo) -> diaSemana ISO (1 = segunda ... 7 = domingo). */
export function diaSemanaIso(data: Date): number {
  const d = data.getDay();
  return d === 0 ? 7 : d;
}

/** "13:00:00" ou "13:00" -> "13:00". */
export function normalizarHora(hora: string): string {
  return hora.slice(0, 5);
}

export function paraMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function deMinutos(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "00:00", "00:30", ... "23:30". */
export const OPCOES_HORARIO: string[] = Array.from({ length: 48 }, (_, i) => deMinutos(i * 30));

/** Grade com os horários em "HH:mm" e ordenada por dia e abertura. */
export function normalizarGrade(horarios: HorarioDTO[]): HorarioDTO[] {
  return horarios
    .map((h) => ({ diaSemana: h.diaSemana, abre: normalizarHora(h.abre), fecha: normalizarHora(h.fecha) }))
    .sort((a, b) => a.diaSemana - b.diaSemana || paraMinutos(a.abre) - paraMinutos(b.abre));
}

export function mesmaGrade(a: HorarioDTO[], b: HorarioDTO[]): boolean {
  return JSON.stringify(normalizarGrade(a)) === JSON.stringify(normalizarGrade(b));
}

export function intervalosDoDia(horarios: HorarioDTO[], data: Date): HorarioDTO[] {
  const dia = diaSemanaIso(data);
  return normalizarGrade(horarios).filter((h) => h.diaSemana === dia);
}

/**
 * Mesma regra do backend (HorarioService.atende): sem grade = sem restrição;
 * com grade, a sessão inteira precisa caber num intervalo do dia, sem passar da meia-noite.
 */
export function atende(horarios: HorarioDTO[], data: Date, inicio: string, duracaoMinutos: number): boolean {
  if (horarios.length === 0) return true;
  const ini = paraMinutos(inicio);
  const fim = ini + duracaoMinutos;
  if (fim > 24 * 60) return false;
  return intervalosDoDia(horarios, data).some(
    (h) => ini >= paraMinutos(h.abre) && fim <= paraMinutos(h.fecha),
  );
}

/** "13:00" -> "13h", "13:30" -> "13h30". */
function horaCurta(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/**
 * Linhas para exibir a grade, juntando dias seguidos com os mesmos horários:
 *   ["Ter a Sex · 13h–20h", "Sáb · 10h–14h"]
 */
export function resumirGrade(horarios: HorarioDTO[]): string[] {
  const porDia = new Map<number, string>();
  for (const h of normalizarGrade(horarios)) {
    const faixa = `${horaCurta(h.abre)}–${horaCurta(h.fecha)}`;
    porDia.set(h.diaSemana, porDia.has(h.diaSemana) ? `${porDia.get(h.diaSemana)}, ${faixa}` : faixa);
  }

  const linhas: string[] = [];
  let inicio = 0;
  let fim = 0;
  let faixaAtual = '';
  const fechar = () => {
    if (!faixaAtual) return;
    const dias = inicio === fim ? DIAS_CURTOS[inicio] : `${DIAS_CURTOS[inicio]} a ${DIAS_CURTOS[fim]}`;
    linhas.push(`${dias} · ${faixaAtual}`);
  };

  for (let dia = 1; dia <= 7; dia++) {
    const faixa = porDia.get(dia);
    if (faixa && faixa === faixaAtual && fim === dia - 1) {
      fim = dia;
      continue;
    }
    fechar();
    faixaAtual = faixa ?? '';
    inicio = dia;
    fim = dia;
  }
  fechar();
  return linhas;
}
