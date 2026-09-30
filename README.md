# Rabisko

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot%204.0.6-brightgreen)
![Mobile](https://img.shields.io/badge/mobile-Expo%20SDK%2054-000020)
![Java](https://img.shields.io/badge/Java-21-orange)
![License](https://img.shields.io/badge/license-n%C3%A3o%20definida-lightgrey)

> Projeto de TCC (FECAP) — plataforma de agendamento para o mercado de tatuagem no Brasil.

## Descrição

**Rabisko** é um marketplace de agendamento de tatuagens que conecta **clientes**, **tatuadores** e **estúdios**. A plataforma permite que clientes descubram artistas e estúdios, visualizem portfólios, conversem em tempo real e agendem sessões; tatuadores e estúdios gerenciam perfil, portfólio e agenda de atendimentos em um único lugar.

O projeto nasce da dificuldade de encontrar e agendar com tatuadores de forma centralizada — hoje esse processo é fragmentado entre redes sociais, WhatsApp e indicações informais, sem um fluxo padronizado de descoberta, negociação e confirmação de horário.

É útil para:
- **Clientes** que querem pesquisar estilos/artistas, conversar com tatuadores e marcar sessões;
- **Tatuadores e estúdios** que precisam expor portfólio, responder clientes e controlar sua agenda em um app dedicado.

Todo o conteúdo voltado ao usuário (telas, mensagens de API, nomes de domínio) é em **português do Brasil**.

## Demo / Screenshot

> _[Inserir aqui GIF ou prints do app mobile — ex.: fluxo de busca de tatuador, tela de chat e tela de agendamento]_

## Índice

- [Descrição](#descrição)
- [Demo / Screenshot](#demo--screenshot)
- [Funcionalidades principais](#funcionalidades-principais)
- [Stack técnica](#stack-técnica)
- [Pré-requisitos](#pré-requisitos)
- [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
- [Instalação](#instalação)
  - [Backend](#backend)
  - [Mobile](#mobile)
- [Uso / Exemplos](#uso--exemplos)
- [Configuração](#configuração)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como contribuir](#como-contribuir)
- [Testes](#testes)
- [Roadmap](#roadmap)
- [Licença](#licença)
- [Autores / Contato](#autores--contato)

## Funcionalidades principais

- **Cadastro e autenticação** de clientes, tatuadores e estúdios via JWT (`/auth/login`, `/user/cadastro`).
- **Perfis de tatuador e estúdio**, com portfólio de imagens e avaliações.
- **Busca e descoberta** de artistas/estúdios por estilo de tatuagem (`estilo`).
- **Chat em tempo real** entre cliente e tatuador (REST + WebSocket/STOMP).
- **Agendamento de sessões** (`appointment`), com status e histórico de atendimentos.
- **Simulação de tatuagem**: remoção de fundo de um desenho (traço preto sobre branco) via visão computacional (BoofCV), gerando um PNG com transparência para pré-visualização sobre a pele.
- **Dashboard do tatuador** com métricas de conversas e agendamentos.

## Stack técnica

**Backend** (`backend/`)
- Java 21 + Spring Boot 4.0.6 (Web, Security, Validation, Data JPA, WebSocket)
- PostgreSQL gerenciado via Supabase
- Autenticação JWT (`com.auth0:java-jwt`)
- BoofCV (`boofcv-all`) para visão computacional
- Maven (wrapper `mvnw` / `mvnw.cmd`)

**Mobile** (`mobile/`)
- Expo SDK 54 · React Native 0.81 · React 19 · TypeScript
- Navegação: React Navigation (bottom tabs + native stack)
- Estilo: NativeWind v4 (Tailwind CSS para React Native)
- Estado: Zustand (com persistência via AsyncStorage)
- HTTP: Axios · WebSocket: STOMP (`@stomp/stompjs`)

**Infra / dados**
- Supabase (Postgres + Storage) — migrations em `supabase/`

**Status do projeto:** em desenvolvimento (TCC).
**Licença:** nenhuma definida ainda.

## Pré-requisitos

Backend:
- [JDK 21](https://adoptium.net/)
- Maven (ou use o wrapper incluído `./mvnw`)
- Acesso a um banco PostgreSQL (recomendado: [Supabase](https://supabase.com))

Mobile:
- [Node.js](https://nodejs.org/) (LTS recente)
- npm (ou yarn/pnpm)
- App **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/br/app/expo-go/id982107779)) — não é necessário build nativo para desenvolvimento
- Celular e computador na mesma rede (ou usar o modo túnel do Expo)

## Ambiente de Desenvolvimento

O projeto usa **Dev Containers** para padronizar o ambiente local (Java 21, Node 20 e Supabase CLI já provisionados), com **Maven nativo** (sem Docker Compose) para rodar o backend e **Supabase CLI** para subir Postgres/Auth/Storage localmente em containers Docker.

### Pré-requisito: Docker Desktop (Windows)

- Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e deixe-o em execução — ele é quem hospeda tanto os containers do Supabase local quanto o próprio Dev Container.
- O `.devcontainer/devcontainer.json` usa a feature `docker-outside-of-docker`: o Docker CLI, quando rodado *dentro* do Dev Container, se conecta ao Docker Desktop do Windows (host) em vez de rodar Docker aninhado.

### ⚠️ `supabase start` roda fora do Dev Container

O Supabase CLI **não funciona de forma confiável dentro do Dev Container**: ele sobe os containers do Postgres/Auth/Storage via `docker-outside-of-docker` (containers "irmãos" no Docker Desktop do host), mas em seguida tenta verificar se o Postgres subiu conectando em `127.0.0.1` — que, de dentro do Dev Container, é o loopback do próprio container, não o do host Windows. Isso faz o comando falhar e derrubar os containers logo em seguida (`ECONNREFUSED 127.0.0.1:54322`). É uma limitação conhecida do CLI, sem flag de contorno ([supabase/cli#1939](https://github.com/supabase/cli/issues/1939)).

Por isso, o fluxo é dividido:
- **`supabase start` / `supabase stop`** → rodam num **Git Bash nativo do Windows** (fora do VS Code conectado ao container). Use Git Bash especificamente: `start-dev.sh` é um script bash e não roda em PowerShell/cmd diretamente.
- **Backend e mobile** → rodam normalmente **dentro** do Dev Container, e se conectam ao Supabase local via `host.docker.internal` (em vez de `localhost`) — já configurado em `.env.example`.

### Abrindo o Dev Container

1. Instale a extensão **Dev Containers** no VS Code.
2. Abra a pasta do repositório e escolha **"Reopen in Container"** (ou `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`).
3. O container já vem com Java 21, Node 20, Maven wrapper e as extensões do VS Code (Java Pack, Expo Tools, ESLint). O `postCreateCommand` roda `npm install` automaticamente na raiz — isso serve só para uso *dentro* do container; **não** prepara o Supabase CLI usado no passo abaixo (ver aviso a seguir).

> Não quer usar Dev Containers? Basta ter Docker Desktop, JDK 21, Maven e Node.js instalados localmente e seguir a seção [Instalação](#instalação) abaixo — nesse caso `localhost` funciona normalmente em todo lugar, sem a ressalva do `host.docker.internal`.

### Subindo o ambiente com `start-dev.sh`

O backend **depende do Supabase local estar no ar** (Postgres na porta `54322`, Auth e Storage) para funcionar. Num **Git Bash nativo do Windows** (não o terminal do Dev Container, nem PowerShell/cmd — ver aviso acima), na raiz do repositório:

```bash
./start-dev.sh
```

O script roda `npm install` automaticamente antes de subir o Supabase, garantindo o binário do CLI para **Windows** — o `npm install` do `postCreateCommand` (dentro do container) baixa o binário para Linux, que não roda nativamente no Windows, então os dois `npm install` (container e nativo) são necessários e independentes.

Ele executa `npx supabase start` (sobe os containers do Postgres/Auth/Storage e exibe a API URL e as chaves) e, em seguida, imprime instruções para abrir o Dev Container e, dentro dele, **duas abas de terminal**:

Antes de rodar o backend, copie `.env.example` para **`backend/.env`** (não para a raiz — o `mvnw` roda com `backend/` como diretório de trabalho, e é de lá que o `spring.config.import` resolve o `.env`; veja a seção [Configuração](#configuração) abaixo para o passo a passo de onde pegar cada valor). Dentro do Dev Container, use as variáveis `DB_URL`/`DB_USER`/`DB_PASS`/`SUPABASE_URL` apontando para `host.docker.internal`. Para encerrar o Supabase local depois, no mesmo Git Bash: `npx supabase stop`.

```bash
# aba 2 (dentro do Dev Container) — backend
cd backend
./run-dev.sh

# aba 3 (dentro do Dev Container) — mobile
cd mobile
npm run tunnel   # = expo start --tunnel
```

> Use `./run-dev.sh` como comando **padrão** para o backend (não `mvnw spring-boot:run` direto). Dentro do Dev Container, `mvnw spring-boot:run` trava a JVM com SIGSEGV ao inicializar — o classpath "achatado" que ele monta expõe simultaneamente os binários nativos do JavaCPP/BoofCV (OpenCV/FFmpeg) para Linux, Windows e macOS, e algo nessa combinação derruba o processo. `run-dev.sh` builda e roda via `java -jar` (classloader aninhado do Spring Boot), o que evita o crash. Custo: sem hot-reload do DevTools — rode o script de novo a cada mudança de código.
>
> Use `npm run tunnel` como comando **padrão** para o mobile (não `npm start`/`npx expo start` puro). Dentro do Dev Container, o Metro roda num container Docker — o celular físico com Expo Go não alcança o IP interno dele numa rede local comum, então o modo túnel (relé da Expo pela internet) é o que funciona de forma confiável independente da rede. Veja mais detalhes na seção abaixo.

### Testando no celular com Expo Go

O VS Code, por padrão, só encaminha portas do Dev Container para `127.0.0.1` no Windows — não acessível por um celular na mesma rede Wi-Fi. Por isso, o `.devcontainer/devcontainer.json` usa `runArgs` para o **Docker** publicar as portas 8080 (backend) e 8081 (Metro) diretamente em todas as interfaces do host (igual já acontece com os containers do Supabase), em vez de depender do encaminhamento do VS Code.

- **Metro (Expo)**: `npm run tunnel` (= `expo start --tunnel`) dentro do Dev Container — funciona em qualquer rede via relé da Expo, sem depender do IP local. É o comando padrão do projeto para rodar o mobile (ver acima).
- **Backend**: `mobile/.env` (`EXPO_PUBLIC_API_URL`) deve apontar para o IP da sua máquina na rede local (ex.: `http://192.168.15.5:8080`, não `localhost`) — é assim que o app no celular alcança a API.

Se você alterou `devcontainer.json` (`runArgs`/`forwardPorts`), é preciso **"Dev Containers: Rebuild Container"** para aplicar — só um "Reload Window" não é suficiente, pois `runArgs` só é lido na criação do container.

## Instalação

### Backend
Instalar Docker

```bash
# iniciar banco de dados local (Supabase CLI — rodar na raiz do repositório)
supabase start
# anote a "API URL" e a "service_role key" exibidas ao final do comando

# aplicar todas as migrations para criar as tabelas no banco local
supabase db reset

# configure as variáveis de ambiente do backend (ver seção Configuração)
# crie o arquivo backend/.env com base em backend/env-example.md

# rodar em modo desenvolvimento
cd backend
./run-dev.sh
```

> `run-dev.sh` builda o jar e roda via `java -jar` em vez de `mvnw spring-boot:run` — dentro do Dev Container, `spring-boot:run` trava a JVM (SIGSEGV) por causa de como expõe os binários nativos do JavaCPP/BoofCV no classpath. Fora do Dev Container o script funciona igual, só sem o hot-reload do DevTools (rode de novo a cada mudança de código).

A API sobe em `http://localhost:8080`.

Para gerar o artefato de build:

```bash
./mvnw clean package
```

### Mobile

```bash
cd mobile

# instale as dependências (use sempre npx expo install para libs nativas,
# assim a versão fica alinhada ao Expo SDK 54)
npm install

# configure a URL da API (ver seção Configuração)
# crie mobile/.env com base em mobile/env-example.md
# substitua [SEU-IP] pelo IP da sua máquina na rede local
echo "EXPO_PUBLIC_API_URL=http://[SEU-IP]:8080" >> .env

# inicie o Metro bundler (modo túnel — padrão do projeto, funciona em
# qualquer rede independente de IP local/firewall)
npm run tunnel
```

Escaneie o QR Code exibido no terminal com o app **Expo Go** (Android: opção "Scan QR Code" dentro do app; iOS: câmera nativa). Se preferir modo LAN (mais rápido, mas exige celular e PC na mesma rede e sem bloqueios de firewall):

```bash
npm start   # = expo start --offline
```

Atalhos de plataforma (emulador/simulador local):

```bash
npm run android
npm run ios
npm run web
```

## Uso / Exemplos

### Exemplo 1 — Autenticação via API (backend)

```bash
# Cadastro de um cliente
curl -X POST http://localhost:8080/user/cadastro \
  -H "Content-Type: application/json" \
  -d '{
        "nome": "Maria Silva",
        "email": "maria@exemplo.com",
        "senha": "senha-segura",
        "role": "cliente"
      }'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@exemplo.com", "senha": "senha-segura"}'
# -> retorna um token JWT (válido por 2h) a ser enviado em
#    "Authorization: Bearer <token>" nas demais requisições
```

### Exemplo 2 — Consumindo a API autenticada

```bash
curl http://localhost:8080/artist \
  -H "Authorization: Bearer <token>"
```

### Exemplo 3 — Rodando o app mobile localmente

```bash
cd mobile
npm install
npm run tunnel
# abra o Expo Go no celular e escaneie o QR Code para navegar
# pelos fluxos de login, busca de tatuadores, chat e agendamento
```

## Configuração

### Backend (`backend/.env`)

Copie `.env.example` (raiz do repo) para **`backend/.env`** (não para a raiz — ver aviso na seção [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)). Depois de rodar `./start-dev.sh` (ou `supabase start` manualmente), o terminal imprime um painel assim — é dali que vêm quase todos os valores:

```
⛁ Database
URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres

🌐 APIs
Project URL: http://127.0.0.1:54321

🔑 Authentication Keys
Publishable: sb_publishable_...
Secret:      sb_secret_...

📦 Storage (S3)
Access Key: ...
Secret Key: ...
```

| Variável | Onde pegar | Obrigatória |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASS` | Seção **"⛁ Database"**: sempre `postgres`/`postgres` em dev local. Pode deixar em branco fora do Dev Container (o `application-local.yml` já assume `localhost:54322`); **dentro** do Dev Container, preencha com `jdbc:postgresql://host.docker.internal:54322/postgres` | Só dentro do Dev Container |
| `JWT_SECRET` | Não vem de lugar nenhum — invente uma string longa e aleatória (ex.: `openssl rand -hex 32` no Git Bash) | Recomendada (fallback inseguro `my-secret-key` se ausente) |
| `SUPABASE_URL` | Seção **"🌐 APIs" → "Project URL"**. Fora do Dev Container use `http://127.0.0.1:54321`; dentro dele, `http://host.docker.internal:54321` | Sim (upload de imagens) |
| `SUPABASE_SERVICE_ROLE_KEY` | Seção **"🔑 Authentication Keys" → "Secret"** (`sb_secret_...`). ⚠️ **Não** é a "Access Key"/"Secret Key" da seção "📦 Storage (S3)" — aquela é para outro protocolo e não funciona aqui | Sim (upload de imagens) |

Detalhes do schema/migrations em `backend/database.md` e `supabase/`.

### Mobile (`mobile/.env`)

Crie `mobile/.env` com base em `mobile/env-example.md` — **todas as variáveis devem começar com `EXPO_PUBLIC_`**, conforme exigido pelo Expo para variáveis expostas ao bundle do app:

| Variável | Onde pegar |
|---|---|
| `EXPO_PUBLIC_API_URL` | **IP local da sua máquina na rede Wi-Fi** (não `localhost`/`127.0.0.1` — o celular físico com Expo Go precisa de um endereço que ele consiga alcançar na rede). Descubra com `ipconfig` no PowerShell/Git Bash → veja "Endereço IPv4" do adaptador ativo (Wi-Fi ou Ethernet), ex.: `192.168.15.5`. Formato final: `http://192.168.15.5:8080` (porta 8080 = backend) |

> Esse IP muda se você trocar de rede (ex.: outro Wi-Fi) — se o app parar de conectar no backend, confira primeiro se o IP em `mobile/.env` ainda bate com o `ipconfig` atual.
>
> Nota: no momento, o cliente HTTP em `src/services/api/index.ts` ainda usa uma `baseURL` placeholder — a integração final com o backend depende de conectar essa configuração a `EXPO_PUBLIC_API_URL`.

## Estrutura de pastas

```
rabisko/
├── backend/                       # API REST (Spring Boot / Java 21)
│   └── src/main/java/com/rabisko/mvp/
│       ├── user/                  # Usuários, autenticação, JWT
│       ├── artist/                # Perfil de tatuador, portfólio, avaliações
│       ├── client/                # Perfil de cliente
│       ├── studio/                # Perfil de estúdio
│       ├── estilo/                # Estilos de tatuagem
│       ├── chat/                  # Chat e mensagens (REST + WebSocket)
│       ├── appointment/           # Agendamentos e sessões
│       ├── simulation/            # Simulação de tatuagem (BoofCV)
│       └── shared/                # Storage, segurança, config de WebSocket
│
├── mobile/                        # App (Expo / React Native / TypeScript)
│   ├── src/
│   │   ├── screens/               # Telas (Auth/ e App/)
│   │   ├── routes/                # Navegação (auth vs. app, tabs, stacks)
│   │   ├── components/common/     # UI compartilhada (Button, Input, ...)
│   │   ├── store/                 # Estado global (Zustand)
│   │   ├── services/api/          # Cliente HTTP (Axios)
│   │   └── theme/                 # Tokens de design (cores, spacing, radius)
│   └── design/                    # Design system (DESIGN.md, tokens)
│
├── supabase/                      # Migrations do banco (Postgres/Supabase)
└── tutorial_inicializacao.md      # Guia detalhado de execução via Expo Go
 
```

## Como contribuir

1. Faça um fork do repositório (ou crie uma branch, se você tiver acesso direto).
2. Crie uma branch a partir de `dev` com um nome descritivo:
   ```bash
   git checkout -b feature/nome-da-funcionalidade
   ```
3. Escreva commits claros e no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), ex.:
   ```
   feat: adiciona busca de tatuadores por estilo
   fix: corrige comparação de UserRole no cadastro
   chore: atualiza dependências do mobile
   ```
4. Abra um Pull Request para a branch `dev`, descrevendo o que foi alterado e por quê.
5. Aguarde revisão antes do merge — PRs para `main`/`homol` normalmente passam por `dev` primeiro.

## Testes

Backend:

```bash
cd backend

# todos os testes
./mvnw test

# um teste específico
./mvnw test -Dtest=MvpApplicationTests#contextLoads
```

Mobile: ainda **não há test runner configurado** no app mobile.

## Roadmap

- [ ] Conectar o app mobile ao backend real (substituir `baseURL` placeholder do Axios)
- [ ] Construir a tela de "Simulação" de tatuagem no mobile (endpoint de backend já existe)
- [ ] Corrigir a comparação de `UserRole` no cadastro (`UserService`), que hoje impede a criação automática do perfil de `Artist`/`Client`
- [ ] Migrar as telas mobile para os tokens do design system (`mobile/design/DESIGN.md`)
- [ ] Adicionar suíte de testes automatizados no mobile
- [ ] Definir licença do projeto

## Licença

Este projeto ainda **não possui uma licença definida**. Até a definição, todos os direitos são reservados aos autores.

## Autores / Contato

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC) — FECAP.

- Vitor Hideki Tokunaga — [@VitorToku](https://github.com/VitorToku)
- Vinicius Binda — [@VinnizzZ](https://github.com/VinnizzZ)
- Bruno Costa Dourado — [@brunocosta800](https://github.com/brunocosta800)

Repositório: [github.com/Rabisko-RBSK/rabisko](https://github.com/Rabisko-RBSK/rabisko)
