/**
 * No ambiente local o backend grava as URLs do Storage com o SUPABASE_URL
 * dele (`http://127.0.0.1:54321/...`). No celular, `127.0.0.1` é o próprio
 * aparelho, então a imagem não carrega. Aqui trocamos esse host pelo host do
 * backend (EXPO_PUBLIC_API_URL), que é o IP do PC na rede — o Supabase local
 * publica a 54321 em todas as interfaces (ver docs/AMBIENTE-LOCAL.md).
 *
 * Em produção as URLs apontam pro Supabase real e passam intactas.
 */
const HOST_API = (() => {
  const m = /^https?:\/\/([^/:]+)/.exec(process.env.EXPO_PUBLIC_API_URL ?? '');
  return m?.[1] ?? null;
})();

const HOST_LOCAL = /^(https?:\/\/)(127\.0\.0\.1|localhost|host\.docker\.internal)(?=[:/])/;

export function resolverUrlStorage(url: string): string;
export function resolverUrlStorage(url: string | null | undefined): string | null;
export function resolverUrlStorage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!HOST_API || HOST_API === '127.0.0.1' || HOST_API === 'localhost') return url;
  return url.replace(HOST_LOCAL, `$1${HOST_API}`);
}
