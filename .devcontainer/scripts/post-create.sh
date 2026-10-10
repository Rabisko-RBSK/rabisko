#!/usr/bin/env bash
# Roda uma vez, quando o Dev Container é criado (postCreateCommand).
# Instala dependências para que a primeira execução de cada parte seja rápida.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# Clones no Windows (core.autocrlf=true) têm arquivos com CRLF no disco; sem
# isto o git daqui de dentro mostra todos como modificados. --global vale só
# para este container (o .git/config é compartilhado com o host).
git config --global core.autocrlf input

echo "==> Dependências da raiz (Supabase CLI fixado no package-lock.json)"
npm ci

echo "==> Dependências do mobile"
(cd mobile && npm ci)

echo "==> Dependências Maven do backend"
# Não derruba a criação do container se a rede falhar: o Maven baixa o que
# faltar no primeiro build.
(cd backend && ./mvnw -q -B dependency:go-offline) \
  || echo "AVISO: falha ao baixar dependências Maven; serão baixadas no primeiro build." >&2
