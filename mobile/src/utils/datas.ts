/**
 * Tempo relativo em português ("Agora mesmo", "Há 2 horas", "Há 3 dias").
 * Usado nos cartões de avaliação. Mantém granularidade simples — para essa
 * precisão não vale o custo de timezone nem de uma lib de datas.
 *
 * @param iso data em ISO-8601 (ex.: avaliacoes.data_criacao do backend).
 */
export function tempoRelativo(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  const diffMs = Date.now() - data.getTime();
  // Datas no futuro (relógios dessincronizados) caem em "Agora mesmo".
  if (diffMs < 60_000) return 'Agora mesmo';

  const minutos = Math.floor(diffMs / 60_000);
  if (minutos < 60) return `Há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `Há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return `Há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;

  const anos = Math.floor(meses / 12);
  return `Há ${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}
