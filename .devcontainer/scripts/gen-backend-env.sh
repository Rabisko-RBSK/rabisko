#!/usr/bin/env bash
# Cria ou completa backend/.env com as credenciais do Supabase local.
# Nunca sobrescreve um valor já preenchido: só adiciona chaves ausentes ou
# preenche chaves que existem com valor vazio (ex.: "SUPABASE_URL=").
#
# DB_URL/DB_USER/DB_PASS não são gerados: o application-local.yml já assume
# localhost:54322 com postgres/postgres, que funciona dentro do Dev Container
# graças ao encaminhamento feito em supabase-up.sh.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"
cd "$ROOT_DIR"

# Lê só as chaves de interesse da saída KEY="valor" do CLI.
STATUS="$(npx supabase status -o env 2>/dev/null)" || {
  echo "Erro: 'supabase status' falhou — o Supabase local está no ar? (npm run db:start)" >&2
  exit 1
}
status_value() {
  printf '%s\n' "$STATUS" | sed -nE "s/^$1=\"?([^\"]*)\"?\$/\1/p"
}

API_URL="$(status_value API_URL)"
# SERVICE_ROLE_KEY (JWT) — e não SECRET_KEY (sb_secret_...): o Storage local
# rejeita a sb_secret_ no header Authorization com 403 "Invalid Compact JWS".
SERVICE_ROLE_KEY="$(status_value SERVICE_ROLE_KEY)"

if [ -z "$API_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "Erro: não encontrei API_URL/SERVICE_ROLE_KEY em 'supabase status -o env'." >&2
  echo "       O serviço de auth (gotrue) foi excluído do 'supabase start'?" >&2
  exit 1
fi

touch "$ENV_FILE"
# Garante quebra de linha no fim antes de acrescentar chaves.
[ -s "$ENV_FILE" ] && [ -n "$(tail -c1 "$ENV_FILE")" ] && echo >> "$ENV_FILE"

# set_if_missing <CHAVE> <valor>
set_if_missing() {
  local key="$1" value="$2"
  if grep -qE "^${key}=.+" "$ENV_FILE"; then
    echo "    $key: mantido (já definido)"
  elif grep -qE "^${key}=\$" "$ENV_FILE"; then
    sed -i "s|^${key}=\$|${key}=${value}|" "$ENV_FILE"
    echo "    $key: preenchido"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
    echo "    $key: adicionado"
  fi
}

echo "==> Atualizando backend/.env"
set_if_missing SUPABASE_URL "$API_URL"
set_if_missing SUPABASE_SERVICE_ROLE_KEY "$SERVICE_ROLE_KEY"
# JWT do backend (assinatura dos tokens da API) — não é o JWT_SECRET do Supabase.
set_if_missing JWT_SECRET "$(openssl rand -hex 32)"

if grep -qE '^(DB_URL|SUPABASE_URL)=.*host\.docker\.internal' "$ENV_FILE"; then
  echo "    AVISO: backend/.env usa host.docker.internal (guia antigo). No Dev Container" >&2
  echo "           atual use localhost/127.0.0.1 — remova DB_URL e ajuste SUPABASE_URL" >&2
  echo "           (ver docs/AMBIENTE-LOCAL.md, seção Variáveis de ambiente)." >&2
fi
