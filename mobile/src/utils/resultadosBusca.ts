import { normalize } from './normalize';

/**
 * Busca do cliente: tatuadores e estúdios numa lista só. O backend filtra
 * estilo e distância; o termo livre é filtrado aqui (nome, e-mail, endereço).
 */

type TatuadorBusca = { tatuadorId: string; nome: string; email: string; endereco: string | null };
type EstudioBusca = { estudioId: string; nome: string; endereco: string | null };

export type ResultadoBusca<T extends TatuadorBusca, E extends EstudioBusca> =
  | { tipo: 'tatuador'; chave: string; item: T }
  | { tipo: 'estudio'; chave: string; item: E };

function contem(valor: string | null | undefined, q: string): boolean {
  return !!valor && normalize(valor).includes(q);
}

/** 0 = nome começa com o termo, 1 = nome contém, 2 = casou por outro campo. */
function relevancia(nome: string, q: string | null): number {
  if (!q) return 0;
  const n = normalize(nome);
  if (n.startsWith(q)) return 0;
  if (n.includes(q)) return 1;
  return 2;
}

/**
 * Filtra pelo termo (quando houver) e mescla as duas listas: primeiro os que
 * casam melhor com o termo, depois em ordem alfabética.
 */
export function mesclarResultados<T extends TatuadorBusca, E extends EstudioBusca>(
  tatuadores: T[],
  estudios: E[],
  termo?: string,
): ResultadoBusca<T, E>[] {
  const q = termo ? normalize(termo) : null;

  const todos: ResultadoBusca<T, E>[] = [
    ...tatuadores
      .filter((t) => !q || contem(t.nome, q) || contem(t.email, q) || contem(t.endereco, q))
      .map((item) => ({ tipo: 'tatuador' as const, chave: `t:${item.tatuadorId}`, item })),
    ...estudios
      .filter((e) => !q || contem(e.nome, q) || contem(e.endereco, q))
      .map((item) => ({ tipo: 'estudio' as const, chave: `e:${item.estudioId}`, item })),
  ];

  return todos
    .map((r) => ({ r, rank: relevancia(r.item.nome, q) }))
    .sort((a, b) => a.rank - b.rank || a.r.item.nome.localeCompare(b.r.item.nome, 'pt-BR'))
    .map(({ r }) => r);
}
