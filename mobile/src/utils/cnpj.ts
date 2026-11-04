/**
 * Máscara de CNPJ enquanto o usuário digita: "00.000.000/0000-00". Tira o que
 * não é dígito e corta em 14, então é idempotente e o Backspace funciona.
 */
export function maskCNPJ(s: string): string {
  const d = s.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** O backend confere o CNPJ na Receita Federal antes de criar o estúdio. */
export const AJUDA_CNPJ =
  'O CNPJ precisa estar ativo na Receita Federal, com a atividade de tatuagem (CNAE 9609-2/06).';
