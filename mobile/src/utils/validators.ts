/**
 * Utilitários de validação para formulários do Rabisko.
 */

/**
 * Valida se uma string é um CNPJ válido de acordo com o algoritmo oficial:
 * 1. Remove caracteres não numéricos.
 * 2. Verifica se possui exatamente 14 dígitos.
 * 3. Rejeita sequências de dígitos todos iguais (ex: 00000000000000, 11111111111111, etc.).
 * 4. Calcula e compara o 1º dígito verificador (pesos 5,4,3,2,9,8,7,6,5,4,3,2).
 * 5. Calcula e compara o 2º dígito verificador (pesos 6,5,4,3,2,9,8,7,6,5,4,3,2).
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) {
    return false;
  }

  // Rejeita sequências com todos os dígitos iguais (ex.: 00.000.000/0000-00, 11.111.111/1111-11)
  if (/^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  // 1º Dígito Verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += Number(digits[i]) * weights1[i];
  }
  const mod1 = sum1 % 11;
  const dv1 = mod1 < 2 ? 0 : 11 - mod1;

  if (dv1 !== Number(digits[12])) {
    return false;
  }

  // 2º Dígito Verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += Number(digits[i]) * weights2[i];
  }
  const mod2 = sum2 % 11;
  const dv2 = mod2 < 2 ? 0 : 11 - mod2;

  if (dv2 !== Number(digits[13])) {
    return false;
  }

  return true;
}
