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

## Instalação

### Backend

```bash
cd backend

# defina as variáveis de ambiente necessárias (ver seção Configuração)
export JWT_SECRET=sua-chave-secreta
export SUPABASE_DB_PASSWORD=sua-senha-do-supabase

# rodar em modo desenvolvimento
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

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
echo "EXPO_PUBLIC_API_URL=http://localhost:8080" >> .env

# inicie o Metro bundler (modo offline por padrão)
npm start
```

Escaneie o QR Code exibido no terminal com o app **Expo Go** (Android: opção "Scan QR Code" dentro do app; iOS: câmera nativa). Se o celular não alcançar o computador na mesma rede, use o modo túnel:

```bash
npm run tunnel
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
npm start
# abra o Expo Go no celular e escaneie o QR Code para navegar
# pelos fluxos de login, busca de tatuadores, chat e agendamento
```

## Configuração

### Backend (`backend/`)

Variáveis de ambiente (ver `backend/env-example.md`):

| Variável | Descrição | Obrigatória |
|---|---|---|
| `JWT_SECRET` | Chave usada para assinar/validar os tokens JWT (HMAC256) | Recomendada (fallback inseguro `my-secret-key` se ausente) |
| `SUPABASE_DB_PASSWORD` | Senha de conexão com o banco PostgreSQL (Supabase) | Sim |

A URL JDBC do banco está configurada em `backend/src/main/resources/application.properties`. Detalhes do schema/migrations em `backend/database.md` e `supabase/`.

### Mobile (`mobile/`)

Variáveis de ambiente (ver `mobile/env-example.md`) — **todas devem começar com `EXPO_PUBLIC_`**, conforme exigido pelo Expo para variáveis expostas ao bundle do app:

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base da API do backend |

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
├── tutorial_inicializacao.md      # Guia detalhado de execução via Expo Go
└── CLAUDE.md                      # Documentação de arquitetura para o repositório
```

## Como contribuir

1. Faça um fork do repositório (ou crie uma branch, se você tiver acesso direto).
2. Crie uma branch a partir de `dev` com um nome descritivo:
   ```bash
   git checkout -b feature/nome-da-funcionalidade
   ```
3. Siga os padrões já estabelecidos no módulo que você está alterando (ver `CLAUDE.md` para a arquitetura do backend e do mobile).
4. Escreva commits claros e no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), ex.:
   ```
   feat: adiciona busca de tatuadores por estilo
   fix: corrige comparação de UserRole no cadastro
   chore: atualiza dependências do mobile
   ```
5. Abra um Pull Request para a branch `dev`, descrevendo o que foi alterado e por quê.
6. Aguarde revisão antes do merge — PRs para `main`/`homol` normalmente passam por `dev` primeiro.

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
