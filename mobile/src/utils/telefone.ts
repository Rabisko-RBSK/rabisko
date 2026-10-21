/** Só os dígitos, até 11 (DDD + 9 dígitos). */
export function digitosTelefone(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 11);
}

/**
 * Máscara enquanto o usuário digita:
 *   "11"          -> "(11"
 *   "1134567890"  -> "(11) 3456-7890"   (fixo, 10 dígitos)
 *   "11912345678" -> "(11) 91234-5678"  (celular, 11 dígitos)
 */
export function formatarTelefone(valor: string): string {
  const d = digitosTelefone(valor);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  // Com 11 dígitos, o hífen vai depois do 5º dígito do número (celular).
  const corte = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** Vazio (sem telefone) ou 10/11 dígitos — a mesma regra do backend. */
export function telefoneValido(valor: string): boolean {
  const n = digitosTelefone(valor).length;
  return n === 0 || n === 10 || n === 11;
}
