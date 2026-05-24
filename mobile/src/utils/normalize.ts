/**
 * Normaliza string pra comparacao tolerante a acento e caixa.
 *
 * NFD separa a letra base do diacritico ("ã" -> "a" + U+0303), o regex
 * remove os diacriticos (Combining Diacritical Marks, U+0300..U+036F), e
 * o lowercase + trim cobrem o resto.
 *
 * Usado em autocomplete e did-you-mean: "geometrico" precisa casar com
 * "Geométrico", "REALISMO" com "realismo", etc.
 */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
