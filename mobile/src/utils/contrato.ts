import type {
  ContratoModelo,
  ContratoPeriodicidade,
} from '../services/api/artistService';

export const MODELO_LABELS: Record<ContratoModelo, string> = {
  comissao: 'Comissão',
  aluguel: 'Aluguel',
  salario: 'Salário',
};

export const PERIODICIDADE_LABELS: Record<ContratoPeriodicidade, string> = {
  diaria: 'por dia',
  semanal: 'por semana',
  mensal: 'por mês',
};

/**
 * Campos usados na exibição. Aceita tanto o ContratoDTO (campos `null`)
 * quanto o ContratoInput (campos opcionais), pra servir também de prévia
 * no modal antes de enviar a proposta.
 */
type ContratoResumo = {
  modelo: ContratoModelo;
  percentualEstudio?: number | null;
  valorFixo?: number | null;
  periodicidade?: ContratoPeriodicidade | null;
};

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Texto curto do contrato pras telas:
 *   "Comissão · 40% para o estúdio"
 *   "Aluguel · R$ 800,00 por mês"
 * Se o campo esperado pro modelo vier vazio, devolve só o rótulo do modelo
 * em vez de "null%" ou "R$ NaN".
 */
export function formatarContrato(c: ContratoResumo): string {
  const modelo = MODELO_LABELS[c.modelo];

  if (c.modelo === 'comissao') {
    if (c.percentualEstudio == null) return modelo;
    return `${modelo} · ${c.percentualEstudio.toLocaleString('pt-BR')}% para o estúdio`;
  }

  if (c.valorFixo == null || c.periodicidade == null) return modelo;
  return `${modelo} · ${formatarMoeda(c.valorFixo)} ${PERIODICIDADE_LABELS[c.periodicidade]}`;
}
