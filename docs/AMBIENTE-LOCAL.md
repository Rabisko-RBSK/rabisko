# Ambiente de desenvolvimento local

Este guia mostra como rodar o Rabisko na sua máquina usando o **Dev Container** do repositório. É o único caminho suportado: na máquina host você precisa apenas do VS Code, da extensão Dev Containers e do Docker Desktop. Java, Maven, Node e Supabase CLI ficam dentro do container.

O que roda onde:

- **Dev Container:** backend (Spring Boot), Metro/Expo (mobile) e o Supabase CLI.
- **Docker do host** (docker-outside-of-docker): os containers do Supabase local (Postgres, API/Kong, Storage, Auth, Studio), criados pelo CLI a partir do Dev Container.

---

## 1. Pré-requisitos

| Ferramenta | Observação |
|---|---|
| [VS Code](https://code.visualstudio.com/) | — |
| Extensão [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) | `ms-vscode-remote.remote-containers` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Precisa estar **rodando** antes de abrir o projeto |
| Git | Para clonar |

**Windows:** o Docker Desktop precisa usar o backend **WSL2** (Settings → General → "Use the WSL 2 based engine"). Clonar o repositório no disco do Windows (ex.: `C:\Users\...`) funciona. O `.gitattributes` garante que os scripts `.sh` venham com quebra de linha LF.

**Linux:** Docker Desktop ou Docker Engine. O seu usuário precisa ter acesso ao Docker sem `sudo`.

**Memória:** o Supabase local (com os serviços que usamos) ocupa cerca de 750 MB. Some a isso o backend (JVM), o Metro e o próprio Dev Container. Reserve **pelo menos 4 GB** para o Docker; o recomendado é **6 GB ou mais**. No Windows com WSL2, o limite de memória do Docker vem do arquivo `%UserProfile%\.wslconfig` (seção `[wsl2]`, chave `memory`). Para ver quanto o Docker enxerga:

```bash
docker info --format '{{.MemTotal}}'   # em bytes
```

**Celular (opcional):** app **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/br/app/expo-go/id982107779)).

---

## 2. Primeiro uso

1. Clone o repositório e abra a pasta no VS Code:
   ```bash
   git clone https://github.com/Rabisko-RBSK/rabisko.git
   code rabisko
   ```
2. Com o Docker Desktop rodando, aceite o aviso **"Reopen in Container"** (ou `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`).
3. Aguarde. O VS Code faz automaticamente:
   - **build da imagem** do Dev Container (Java 21, Node 20, Docker CLI);
   - **`postCreateCommand`** (`.devcontainer/scripts/post-create.sh`), só na criação: `npm ci` na raiz (instala o Supabase CLI na versão do `package-lock.json`), `npm ci` em `mobile/` e download das dependências Maven do backend;
   - **`postStartCommand`** (`.devcontainer/scripts/supabase-up.sh`), a cada vez que o container inicia:
     - cria a rede Docker `rabisko_dev` e conecta o Dev Container a ela;
     - sobe o Supabase local; no primeiro start, aplica as migrations de `supabase/migrations`, roda o `supabase/seed.sql` e cria os buckets `profile_images` e `portfolio_images`;
     - gera o `backend/.env` (ver [seção 5](#5-variáveis-de-ambiente)).

   **Tempo:** na primeira vez, conte com **15 a 25 minutos**, dependendo da conexão. Como referência, medido numa máquina de desenvolvimento:
   - download das imagens do Supabase: cerca de 6 minutos;
   - dependências npm (raiz e mobile): cerca de 3 minutos;
   - `supabase start` com as imagens já baixadas: cerca de 45 segundos.

   Nas próximas vezes, o container abre em menos de 1 minuto.
4. Quando o terminal do `postStartCommand` mostrar `Supabase local pronto`, abra um terminal no VS Code (já dentro do container) e suba o backend:
   ```bash
   cd backend
   ./run-dev.sh
   ```
   O primeiro build leva de 1 a 2 minutos. O backend está pronto quando aparecer `Started MvpApplication`.
5. Teste. Uma resposta `401` significa que o backend respondeu e só rejeitou as credenciais:
   ```bash
   curl -i -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" -d '{"login":"x","senha":"y"}'
   ```

---

## 3. Uso diário

Todos os comandos abaixo rodam **no terminal do VS Code dentro do Dev Container**, a partir da raiz do repositório (exceto quando indicado).

### Supabase

O Supabase sobe sozinho quando o container inicia. Para controlar à mão:

```bash
npm run db:start    # sobe (idempotente; também refaz rede/encaminhamentos e completa backend/.env)
npm run db:status   # mostra URLs e chaves
npm run db:stop     # para os containers (os dados ficam guardados em volumes Docker)
```

Fechar o VS Code **não** para o Supabase: os containers continuam rodando no Docker do host. Para liberar memória, rode `npm run db:stop` antes de fechar.

> Use sempre os comandos de dentro do Dev Container. Rodar o Supabase CLI direto no host cria os containers em outra rede. Se isso acontecer, `npm run db:start` reconecta o Dev Container.

### Backend

```bash
cd backend
./run-dev.sh
```

Pare com `Ctrl+C`. O script compila e roda o jar (`java -jar`) com o profile `local`.

> Não use `./mvnw spring-boot:run`: dentro do container a JVM cai com SIGSEGV por causa dos binários nativos do BoofCV/JavaCPP no classpath (detalhes em `backend/run-dev.sh`). Por isso não há hot reload; rode o script de novo após mudar o código.

### Mobile

```bash
cd mobile
npm run tunnel      # expo start --tunnel
```

Pare com `Ctrl+C`. Veja a [seção 7](#7-rodando-o-app-no-celular) para o modo sem túnel.

---

## 4. Serviços e portas

| Serviço | No host (navegador/ferramentas do seu PC) | Dentro do Dev Container | Na rede local (celular) |
|---|---|---|---|
| Supabase API (Kong: Storage etc.) | `http://localhost:54321` | `http://127.0.0.1:54321` | `http://<IP-do-host>:54321` |
| Postgres | `localhost:54322` (usuário/senha `postgres`) | `localhost:54322` | — |
| Supabase Studio | `http://localhost:54323` | — | — |
| Backend (Spring Boot) | `http://localhost:8080` | `http://localhost:8080` | `http://<IP-do-host>:8080` |
| Metro (Expo) | `http://localhost:8081` | `http://localhost:8081` | `http://<IP-do-host>:8081` |

Como funciona:

- **Supabase:** os containers publicam as portas 543xx em todas as interfaces do host. Dentro do Dev Container, `127.0.0.1:54321` e `127.0.0.1:54322` são encaminhamentos (`socat`) para os containers `supabase_kong_rabisko` e `supabase_db_rabisko` na rede `rabisko_dev`. Por isso `localhost` funciona igual dentro e fora do container.
- **Backend e Metro:** as portas 8080 e 8081 são publicadas pelo Docker em todas as interfaces do host (`runArgs` no `devcontainer.json`), e não só em `127.0.0.1` como no port forwarding do VS Code. É isso que permite o acesso pelo celular.

---

## 5. Variáveis de ambiente

### `backend/.env`: gerado automaticamente

O `supabase-up.sh` chama `.devcontainer/scripts/gen-backend-env.sh` (que você também pode rodar com `npm run env:backend`). Ele **só adiciona chaves ausentes ou vazias**: um valor que você alterou à mão nunca é sobrescrito.

| Variável | Valor gerado |
|---|---|
| `SUPABASE_URL` | `http://127.0.0.1:54321` (`API_URL` do `supabase status`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` do `supabase status` (JWT `eyJ...`) |
| `JWT_SECRET` | aleatório (`openssl rand -hex 32`), usado para assinar os tokens da API do backend |

Não são gerados, porque o profile `local` já tem defaults que funcionam:

- `DB_URL`, `DB_USER` e `DB_PASS`: o `application-local.yml` usa `jdbc:postgresql://localhost:54322/postgres` com `postgres`/`postgres`.
- `SPRING_PROFILES_ACTIVE=local`: vem do `containerEnv` do Dev Container.

Atenção:

- O Storage precisa da **`SERVICE_ROLE_KEY`** (JWT). A chave `sb_secret_...` (`SECRET_KEY`) é rejeitada pelo Storage local com `403 Invalid Compact JWS`.
- O `JWT_SECRET` que aparece no `supabase status` é o do Supabase, **não** o do backend.
- Se o seu `backend/.env` veio do guia antigo, com `host.docker.internal`, o script mostra um aviso. Apague as linhas `DB_URL` e `SUPABASE_URL` e rode `npm run env:backend` de novo.

Para regenerar tudo do zero: apague `backend/.env` e rode `npm run env:backend`.

### `mobile/.env`: manual

O container não sabe de forma confiável qual é o IP do seu computador na rede Wi-Fi, então este passo é manual. Crie `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://<IP-do-host>:8080
```

Para descobrir o IP, rode **no host** (não no Dev Container):

- Windows (PowerShell): `ipconfig` → "Endereço IPv4" do adaptador Wi-Fi/Ethernet ativo (ex.: `192.168.15.30`).
- Linux: `ip -4 addr` → endereço da interface Wi-Fi/Ethernet.

O IP muda quando você troca de rede. Se o app parar de falar com o backend, confira esse valor primeiro. O Expo lê o `.env` ao iniciar, então reinicie o Metro depois de alterar.

Os dois `.env` estão no `.gitignore`. Nunca faça commit deles.

---

## 6. Banco de dados

As migrations ficam em `supabase/migrations` e o seed em `supabase/seed.sql`. São aplicados automaticamente no **primeiro** start (volume vazio). Nos starts seguintes, os dados persistem nos volumes Docker.

```bash
# Recria o banco local do zero: aplica todas as migrations, roda o seed.sql
# e recria os buckets do Storage. Apaga todos os dados locais.
npm run db:reset

# Cria uma migration nova (arquivo vazio em supabase/migrations/<timestamp>_<nome>.sql)
npx supabase migration new nome_da_migration

# Aplica no banco local as migrations ainda não aplicadas, sem apagar dados
npx supabase migration up --local
```

Os buckets `profile_images` e `portfolio_images` (públicos) são declarados em `supabase/config.toml` (`[storage.buckets.*]`) e criados pelo `start`/`db reset` local.

> Os scripts em `backend/src/main/resources/db/migration` **não** são aplicados por nada (o projeto não usa Flyway). A fonte de verdade do schema é `supabase/migrations`.

---

## 7. Rodando o app no celular

1. Celular e computador na **mesma rede Wi-Fi** (no modo túnel, basta o celular ter internet).
2. Descubra o IP do host e crie o `mobile/.env` ([seção 5](#mobilenv-manual)).
3. Suba o backend (`cd backend && ./run-dev.sh`). Confira no navegador do celular que `http://<IP-do-host>:8080` responde. Qualquer resposta HTTP, mesmo de erro, indica que o backend está acessível; o que não pode acontecer é a página não carregar.
4. Suba o Metro, escolhendo um dos modos:

   **Túnel (padrão do projeto)** funciona em qualquer rede, inclusive redes de faculdade com isolamento entre dispositivos, porque o tráfego passa pelo ngrok da Expo:
   ```bash
   cd mobile
   npm run tunnel
   ```
   Espere `Tunnel ready.`.

   **LAN** é mais rápido, mas exige que o celular alcance o PC pela rede local. Informe ao Expo o IP do host, porque sem isso ele anunciaria o IP interno do container:
   ```bash
   cd mobile
   REACT_NATIVE_PACKAGER_HOSTNAME=<IP-do-host> npx expo start --lan
   ```
   A porta 8081 já é publicada pelo Dev Container. A variável `REACT_NATIVE_PACKAGER_HOSTNAME` funciona no SDK 57, mas o código do Expo CLI a marca como não documentada e candidata a remoção. Se um dia parar de funcionar, use o túnel.
5. Escaneie o QR Code com o Expo Go (Android: "Scan QR Code" no app; iOS: câmera).

**Limitação conhecida:** o backend grava as URLs das imagens com o `SUPABASE_URL` (`http://127.0.0.1:54321/...`). No celular, `127.0.0.1` é o próprio aparelho, então imagens enviadas no ambiente local não carregam no app. O upload em si funciona.

**Firewall do Windows:** se o celular não alcança `http://<IP-do-host>:8080`, verifique se o firewall permite conexões de entrada para o Docker Desktop na rede atual (redes marcadas como "Pública" costumam bloquear).

---

## 8. Troubleshooting

### Porta já em uso (54321–54323, 8080, 8081)

Sintomas: `supabase start` ou a abertura do Dev Container falham com um erro do Docker citando a porta (ex.: `port is already allocated`).

Para descobrir quem está usando a porta:

```powershell
# Windows (PowerShell, no host)
netstat -ano | findstr :54322
Get-Process -Id <PID>
```

```bash
# Linux (no host)
ss -ltnp | grep 54322
```

Causas comuns:

- outro projeto Supabase rodando; liste com `docker ps --filter "name=supabase_"`;
- um Postgres instalado localmente na máquina;
- outro clone do Rabisko com o Supabase no ar (os nomes de container são os mesmos, porque vêm do `project_id` do `config.toml`).

Pare o que estiver em conflito e rode `npm run db:start`.

### Docker sem memória

Sintomas:

- containers reiniciando;
- `supabase start` travado em "Waiting for health checks";
- backend morrendo sem mensagem clara.

Veja o total com `docker info --format '{{.MemTotal}}'` e o consumo por container com `docker stats --no-stream`. Aumente a memória do Docker ([seção 1](#1-pré-requisitos)) ou pare o que não estiver usando (`npm run db:stop`).

### Containers do Supabase órfãos ou com nome em conflito

Sintoma: erro `Conflict. The container name "/supabase_..._rabisko" is already in use`.

```bash
npx supabase stop                              # para os containers deste projeto
docker ps -a --filter "name=supabase_"         # confere o que sobrou
docker rm -f <nome-do-container>               # remove um container específico, se necessário
npm run db:start
```

### `failed to connect to postgres ... 127.0.0.1` ao rodar comandos do Supabase

O banco foi criado fora da rede `rabisko_dev`. Isso acontece quando o CLI é usado fora do Dev Container ou sem a variável `SUPABASE_NETWORK_ID`. Dentro do Dev Container, rode `npm run db:start`: ele reconecta a rede e os encaminhamentos. Depois, `npm run db:reset` se precisar recriar o banco.

### Permissão no socket do Docker

Sintoma: `permission denied while trying to connect to the Docker daemon socket`, ou `Docker inacessível` no `supabase-up.sh`.

```bash
ls -l /var/run/docker.sock   # esperado: dono vscode
id                           # esperado: grupo docker na lista
```

O acesso ao socket depende de um processo `socat` criado pela feature docker-outside-of-docker. **Não mate processos `socat` à mão** (ex.: `pkill socat`), porque isso derruba o acesso ao Docker. Para corrigir, rode `Dev Containers: Rebuild Container`, ou reinicie o container (`docker restart <container>` no host).

### Scripts com CRLF no Windows

Sintoma: `/usr/bin/env: 'bash\r': No such file or directory`.

Num clone novo isso não acontece (`.gitattributes` força LF em `*.sh`). Em um clone feito antes dessa regra, os arquivos continuam com CRLF no disco. Para verificar e corrigir, rode na raiz do repo:

```bash
git ls-files --eol '*.sh'                 # procure "w/crlf"
rm backend/run-dev.sh start-dev.sh .devcontainer/scripts/*.sh
git checkout -- backend/run-dev.sh start-dev.sh .devcontainer/scripts/
```

Um `git checkout` sem apagar antes **não** converte o arquivo.

### Download de imagens falhando (`x509: certificate is valid for ...`)

A rede está interceptando HTTPS. É comum em Wi-Fi com portal de login (hotel, faculdade, café). Faça login no portal ou troque de rede, e rode `npm run db:start` de novo. As imagens que já foram baixadas não são baixadas outra vez.

### `ERROR An unknown error occurred while installing React Native DevTools` ao subir o Metro

Esse erro é inofensivo. O DevTools desktop precisa de bibliotecas gráficas que o container não tem, mas o Metro continua funcionando normalmente.

### Recomeçar do zero

```bash
npx supabase stop --no-backup   # para o Supabase e APAGA os volumes (dados locais)
rm -f backend/.env              # opcional: força gerar um .env novo
```

Depois, `Ctrl+Shift+P` → `Dev Containers: Rebuild Container`. O container é recriado, as dependências são reinstaladas e o Supabase sobe limpo, com migrations, seed e buckets.
