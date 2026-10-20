/**
 * Horário de funcionamento do tatuador — lógica pura (sem React), testada em
 * tests/horarios.test.mjs.
 *
 * Convenções (iguais às do backend / tabela `tatuador_horarios`):
 *   - diaSemana ISO-8601: 1 = segunda ... 7 = domingo;
 *   - horários "HH:mm";
 *   - a API só traz/recebe os dias ABERTOS; dia ausente = fechado;
 *   - horário que vira a meia-noite não é suportado (fecha > abre).
 */

/** Um dia aberto, como trafega na API. */
export interface HorarioDia {
  diaSemana: number;
  abre: string;
  fecha: string;
}

/** Um dia no formulário (os 7 dias, abertos ou não). */
export interface DiaForm {
  diaSemana: number;
  aberto: boolean;
  abre: string;
  fecha: string;
}

/** Sempre 7 itens, de segunda (índice 0) a domingo (índice 6). */
export type SemanaForm = DiaForm[];

export const DIAS = [
  { diaSemana: 1, nome: 'Segunda', nomeLongo: 'Segunda-feira', abrev: 'seg', comPreposicao: 'Na segunda' },
  { diaSemana: 2, nome: 'Terça', nomeLongo: 'Terça-feira', abrev: 'ter', comPreposicao: 'Na terça' },
  { diaSemana: 3, nome: 'Quarta', nomeLongo: 'Quarta-feira', abrev: 'qua', comPreposicao: 'Na quarta' },
  { diaSemana: 4, nome: 'Quinta', nomeLongo: 'Quinta-feira', abrev: 'qui', comPreposicao: 'Na quinta' },
  { diaSemana: 5, nome: 'Sexta', nomeLongo: 'Sexta-feira', abrev: 'sex', comPreposicao: 'Na sexta' },
  { diaSemana: 6, nome: 'Sábado', nomeLongo: 'Sábado', abrev: 'sáb', comPreposicao: 'No sábado' },
  { diaSemana: 7, nome: 'Domingo', nomeLongo: 'Domingo', abrev: 'dom', comPreposicao: 'No domingo' },
] as const;

const ABRE_PADRAO = '10:00';
const FECHA_PADRAO = '22:00';

/** Opções do seletor: 00:00 a 23:30, de 30 em 30 minutos. */
export const OPCOES_HORARIO: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  return `${h}:${i % 2 === 0 ? '00' : '30'}`;
});

/** Semana sugerida no cadastro: seg–sex 10:00–22:00, sáb 10:00–21:00, dom fechado. */
export function semanaPadrao(): SemanaForm {
  return DIAS.map(({ diaSemana }) => ({
    diaSemana,
    aberto: diaSemana !== 7,
    abre: ABRE_PADRAO,
    fecha: diaSemana === 6 ? '21:00' : FECHA_PADRAO,
  }));
}

/** Monta o formulário a partir da API (dias ausentes viram fechados). */
export function semanaDaApi(horarios: HorarioDia[]): SemanaForm {
  return DIAS.map(({ diaSemana }) => {
    const h = horarios.find((x) => x.diaSemana === diaSemana);
    return h
      ? { diaSemana, aberto: true, abre: h.abre.slice(0, 5), fecha: h.fecha.slice(0, 5) }
      : { diaSemana, aberto: false, abre: ABRE_PADRAO, fecha: FECHA_PADRAO };
  });
}

/** Formulário -> corpo da API (só os dias abertos). */
export function semanaParaApi(semana: SemanaForm): HorarioDia[] {
  return semana
    .filter((d) => d.aberto)
    .map(({ diaSemana, abre, fecha }) => ({ diaSemana, abre, fecha }));
}

/** "Definir horário para todos os dias": aplica só aos dias abertos (não reabre os fechados). */
export function aplicarATodosAbertos(semana: SemanaForm, abre: string, fecha: string): SemanaForm {
  return semana.map((d) => (d.aberto ? { ...d, abre, fecha } : d));
}

/** Mesmas regras do ValidadorHorarios do backend. @return mensagem de erro ou null. */
export function validarSemana(semana: SemanaForm): string | null {
  const abertos = semana.filter((d) => d.aberto);
  if (abertos.length === 0) return 'Informe ao menos um dia de atendimento.';
  for (const d of abertos) {
    if (d.fecha <= d.abre) {
      return `${DIAS[d.diaSemana - 1].comPreposicao}, o fechamento precisa ser depois da abertura.`;
    }
  }
  return null;
}

/** Date -> diaSemana ISO (o getDay() do JS começa no domingo = 0). */
export function diaSemanaIso(data: Date): number {
  const d = data.getDay();
  return d === 0 ? 7 : d;
}

/** Linhas da exibição no perfil: os 7 dias, de segunda a domingo. */
export function linhasExibicao(horarios: HorarioDia[]): { diaSemana: number; dia: string; texto: string }[] {
  return DIAS.map(({ diaSemana, nomeLongo }) => {
    const h = horarios.find((x) => x.diaSemana === diaSemana);
    return {
      diaSemana,
      dia: nomeLongo,
      texto: h ? `${h.abre.slice(0, 5)}–${h.fecha.slice(0, 5)}` : 'Fechado',
    };
  });
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Resumo dos dias de atendimento para o card do perfil do tatuador.
 * Ex.: "Seg a sáb · Domingo fechado", "Ter a sáb · Seg e dom fechados".
 */
export function resumoSemana(horarios: HorarioDia[]): string {
  const abertos = new Set(horarios.map((h) => h.diaSemana));
  if (abertos.size === 0) return 'Horário não informado';
  if (abertos.size === 7) return 'Todos os dias';

  // Sequências de dias consecutivos abertos (seg..dom, sem dar a volta na semana).
  const trechos: string[] = [];
  let inicio: number | null = null;
  for (let dia = 1; dia <= 8; dia++) {
    if (dia <= 7 && abertos.has(dia)) {
      if (inicio === null) inicio = dia;
    } else if (inicio !== null) {
      const fim = dia - 1;
      const a = DIAS[inicio - 1].abrev;
      const b = DIAS[fim - 1].abrev;
      trechos.push(inicio === fim ? a : fim === inicio + 1 ? `${a} e ${b}` : `${a} a ${b}`);
      inicio = null;
    }
  }
  const partes = [capitalizar(trechos.join(', '))];

  const fechados = DIAS.filter((d) => !abertos.has(d.diaSemana));
  if (fechados.length === 1) partes.push(`${fechados[0].nomeLongo.split('-')[0]} fechado`);
  if (fechados.length === 2) {
    partes.push(capitalizar(`${fechados[0].abrev} e ${fechados[1].abrev} fechados`));
  }
  return partes.join(' · ');
}
