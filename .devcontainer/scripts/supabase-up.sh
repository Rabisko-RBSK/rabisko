#!/usr/bin/env bash
# Sobe o Supabase local de dentro do Dev Container (postStartCommand).
# Idempotente: pode rodar quantas vezes quiser, com o Supabase parado ou no ar.
#
# Por que tanta coisa: com docker-outside-of-docker, os containers do Supabase
# rodam no Docker do host, mas o Supabase CLI verifica a saúde do Postgres
# conectando em 127.0.0.1:54322 — que aqui é o loopback do Dev Container.
# Solução:
#   1. Dev Container e containers do Supabase compartilham a rede Docker
#      $SUPABASE_NETWORK_ID (o CLI lê essa variável, definida em
#      devcontainer.json, como se fosse a flag --network-id);
#   2. socat expõe em 127.0.0.1 do Dev Container as portas do banco e da API,
#      apontando para os containers pelo nome nessa rede.
# Resultado: localhost:54321/54322 funcionam aqui dentro igual ao host.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

NETWORK="${SUPABASE_NETWORK_ID:-rabisko_dev}"
export SUPABASE_NETWORK_ID="$NETWORK"
PROJECT_ID="$(sed -nE 's/^project_id *= *"([^"]+)".*/\1/p' supabase/config.toml)"
DB_CONTAINER="supabase_db_${PROJECT_ID}"
KONG_CONTAINER="supabase_kong_${PROJECT_ID}"
SELF="$(hostname)"

# Serviços do Supabase que o projeto não usa (ver docs/AMBIENTE-LOCAL.md).
# gotrue (auth) fica: sem ele `supabase status` não exporta as chaves.
EXCLUDE="realtime,imgproxy,mailpit,postgrest,edge-runtime,logflare,vector,supavisor"

log() { echo -e "\033[1m==> $*\033[0m"; }

if ! docker info >/dev/null 2>&1; then
  echo "Erro: Docker inacessível de dentro do Dev Container. O Docker Desktop está rodando?" >&2
  exit 1
fi

connect_self() {
  local net="$1"
  if ! docker inspect -f '{{json .NetworkSettings.Networks}}' "$SELF" | grep -q "\"$net\""; then
    docker network connect "$net" "$SELF"
  fi
}

log "Rede Docker '$NETWORK'"
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null
connect_self "$NETWORK"

# start_forward <porta local> <host:porta destino>
start_forward() {
  local port="$1" target="$2" pidfile="/tmp/socat-$1.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    return
  fi
  setsid nohup socat "TCP-LISTEN:${port},bind=127.0.0.1,fork,reuseaddr" "TCP:${target}" \
    >"/tmp/socat-${port}.log" 2>&1 < /dev/null &
  echo $! > "$pidfile"
}

log "Encaminhando 127.0.0.1:54321 (API) e 127.0.0.1:54322 (Postgres) para os containers do Supabase"
start_forward 54321 "${KONG_CONTAINER}:8000"
start_forward 54322 "${DB_CONTAINER}:5432"

log "Subindo Supabase local (na primeira vez baixa as imagens — pode levar vários minutos)"
npx supabase start -x "$EXCLUDE"

# Se o Supabase já estava no ar em outra rede (ex.: iniciado sem
# SUPABASE_NETWORK_ID), entra também nas redes dele para os nomes resolverem.
for c in "$DB_CONTAINER" "$KONG_CONTAINER"; do
  for net in $(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$c"); do
    connect_self "$net"
  done
done

bash "$ROOT_DIR/.devcontainer/scripts/gen-backend-env.sh"

log "Supabase local pronto. Studio: http://localhost:54323 (no navegador do host)"
