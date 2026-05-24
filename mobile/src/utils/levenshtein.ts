import { normalize } from './normalize';

/**
 * Distancia de Levenshtein (numero minimo de insercoes/deletions/substituicoes
 * pra transformar `a` em `b`). Implementacao dp com 2 linhas, O(min(|a|,|b|))
 * de memoria.
 *
 * Recebe strings ja normalizadas (chamador decide se aplica `normalize()`).
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Sempre coloca a menor no eixo da matriz pra otimizar memoria.
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  let prev = new Array<number>(a.length + 1);
  let curr = new Array<number>(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;

  for (let j = 1; j <= b.length; j++) {
    curr[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1,        // deletion
        curr[i - 1] + 1,    // insertion
        prev[i - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[a.length];
}

export interface ClosestMatchResult<T> {
  item: T;
  distance: number;
}

/**
 * Retorna o item mais proximo de `query` dentre `items`, ou null se o
 * melhor candidato exceder o threshold.
 *
 * Threshold default escala com o tamanho da query: `max(2, floor(len/3))`.
 * Empiricamente: palavras curtas (3-5 letras) toleram 2 typos; palavras
 * mais longas (>=9 letras) toleram 3+; evita falso positivo em queries
 * muito curtas (ex.: "ab" so casaria com algo de distancia <= 2).
 *
 * Comparacao usa normalize() — acento/caixa nao contam como typo.
 */
export function closestMatch<T>(
  query: string,
  items: T[],
  getName: (t: T) => string,
  threshold?: number,
): ClosestMatchResult<T> | null {
  const q = normalize(query);
  if (q.length === 0 || items.length === 0) return null;

  const limit = threshold ?? Math.max(2, Math.floor(q.length / 3));

  let best: ClosestMatchResult<T> | null = null;
  for (const item of items) {
    const d = levenshtein(q, normalize(getName(item)));
    if (best === null || d < best.distance) {
      best = { item, distance: d };
      if (d === 0) break; // exato; nao tem como melhorar
    }
  }
  if (!best || best.distance > limit) return null;
  return best;
}
