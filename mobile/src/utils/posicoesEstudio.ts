/** Limites de `estudios.posicoes` (CHECK no banco e @Min/@Max no backend). */
export const MIN_POSICOES = 1;
export const MAX_POSICOES = 50;

export type ValidacaoPosicoes =
  | { ok: true; valor: number }
  | { ok: false; motivo: 'vazio' | 'invalido' | 'igual' };

/**
 * Valida a nova quantidade digitada na tela de equipe. Igual à atual não é
 * erro, mas também não é salva — não há nada para alterar.
 */
export function validarNovaQuantidade(texto: string, atual: number | null): ValidacaoPosicoes {
  if (!texto.trim()) return { ok: false, motivo: 'vazio' };
  const n = Number(texto);
  if (!Number.isInteger(n) || n < MIN_POSICOES || n > MAX_POSICOES) return { ok: false, motivo: 'invalido' };
  if (n === atual) return { ok: false, motivo: 'igual' };
  return { ok: true, valor: n };
}

export function rotuloPosicoes(n: number): string {
  return `${n} ${n === 1 ? 'posição' : 'posições'}`;
}
