/** Nota média de avaliações com uma casa e vírgula: 4.666 -> "4,7". */
export function formatarNota(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}

/** Nota para exibir num card, ou null quando ainda não há avaliações. */
export function notaParaExibir(notaMedia: number | null, totalAvaliacoes: number): string | null {
  return totalAvaliacoes > 0 && notaMedia != null ? formatarNota(notaMedia) : null;
}
