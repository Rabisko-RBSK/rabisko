#!/usr/bin/env bash
# Sobe o ambiente de desenvolvimento local do Rabisko.
#
# A aplicação (backend) depende do Supabase local estar no ar (Postgres,
# Auth e Storage), então este script cuida disso primeiro e só então
# mostra os próximos passos para rodar backend e mobile em outras abas.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RESET="\033[0m"

if [ ! -d "supabase" ]; then
  echo "Erro: pasta 'supabase/' não encontrada. Rode este script a partir da raiz do repositório." >&2
  exit 1
fi

# `supabase start` usa docker-outside-of-docker para subir os containers no
# Docker Desktop do host, mas o próprio CLI verifica a saúde do Postgres
# conectando em 127.0.0.1 — que, de dentro do Dev Container, é o loopback do
# container, não o do host. Isso faz o `supabase start` falhar e derrubar os
# containers (ver https://github.com/supabase/cli/issues/1939). Por isso este
# script não deve rodar de dentro do Dev Container — rode num Git Bash nativo
# do Windows (fora do VS Code conectado ao container). Não use PowerShell/cmd
# diretamente: este é um script bash e depende de sintaxe (${BASH_SOURCE[0]})
# que eles não entendem.
if [ -f /.dockerenv ] || [ -n "${REMOTE_CONTAINERS:-}" ] || [ -n "${CODESPACES:-}" ]; then
  echo "Erro: este script está rodando dentro de um container (Dev Container)." >&2
  echo "       O Supabase CLI precisa rodar num Git Bash NATIVO do Windows (fora do" >&2
  echo "       Dev Container) — de dentro dele, o CLI não consegue verificar se o" >&2
  echo "       Postgres subiu (127.0.0.1 aponta para o loopback do container, não" >&2
  echo "       do host). Abra o Git Bash na raiz do repositório e rode" >&2
  echo "       './start-dev.sh' por lá." >&2
  echo "       Backend e mobile continuam rodando dentro do Dev Container normalmente," >&2
  echo "       usando host.docker.internal para alcançar o Supabase (ver .env.example)." >&2
  exit 1
fi

# Garante o binário do Supabase CLI para Windows em node_modules/. Rodar
# `npm install` aqui (nativo) é indispensável mesmo que o Dev Container já
# tenha rodado `npm install` no postCreateCommand — aquele baixa o binário
# para Linux (dentro do container), que não roda no Windows. Comando é
# idempotente/rápido quando já está tudo instalado, então roda sempre.
echo -e "${BOLD}==> Garantindo Supabase CLI (nativo Windows)...${RESET}"
npm install

echo -e "${BOLD}==> Subindo Supabase local (Postgres, Auth, Storage)...${RESET}"
echo "    (isso pode demorar na primeira vez, enquanto as imagens do Docker são baixadas)"
npx supabase start

echo
echo -e "${GREEN}${BOLD}Supabase local no ar.${RESET}"
echo "    Studio, API URL, DB URL e chaves foram exibidos acima."
echo "    Preencha backend/.env com base em .env.example antes de continuar"
echo "    (ver seção 'Configuração' do README para onde pegar cada valor)."
echo
echo -e "${BOLD}Próximos passos — abra o Dev Container no VS Code (Reopen in Container)${RESET}"
echo -e "${BOLD}e, dentro dele, uma aba de terminal para cada um:${RESET}"
echo
echo -e "  ${YELLOW}1) Backend (Spring Boot)${RESET}"
echo "     cd backend"
echo "     ./mvnw spring-boot:run -Dspring-boot.run.profiles=local"
echo "     -> sobe em http://localhost:8080"
echo "     -> dentro do Dev Container, use host.docker.internal no lugar de"
echo "        localhost para alcançar o Supabase (variáveis DB_URL/DB_USER/DB_PASS"
echo "        e SUPABASE_URL em backend/.env)"
echo
echo -e "  ${YELLOW}2) Mobile (Expo)${RESET}"
echo "     cd mobile"
echo "     npm run tunnel   # = expo start --tunnel (padrão: Metro roda dentro do"
echo "                      # Dev Container, o celular físico não alcança o IP"
echo "                      # interno dele numa rede local comum)"
echo "     -> escaneie o QR Code com o app Expo Go"
echo
echo -e "${BOLD}Para encerrar o Supabase local quando terminar${RESET} (neste mesmo terminal nativo): npx supabase stop"
