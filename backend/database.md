## Table `chats`

Conversas entre cliente e tatuador.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `chat_id` | `uuid` | Primary |
| `cliente_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `data_criacao` | `timestamptz` |  |
| `ativo` | `bool` |  |
| `ultima_mensagem_em` | `timestamptz` | Nullable |

## Table `clientes`

Perfil de quem contrata tatuagens. Os dados de login ficam em `users`.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `cliente_id` | `uuid` | Primary |
| `user_id` | `uuid` | Unique |
| `data_criacao` | `timestamptz` |  |

## Table `contratos_colaborador`

Condições de contrato entre estúdio e tatuador (comissão, aluguel de bancada ou salário). Contratos nunca são editados: renegociar cria um novo `proposto`, e o anterior só vira `encerrado` quando o tatuador aceita. No máximo 1 `ativo` e 1 `proposto` por par estúdio–tatuador. Comissão usa `percentual_estudio` (0–100, sobre o valor bruto do serviço); aluguel e salário usam `valor_fixo` + `periodicidade`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `contrato_id` | `uuid` | Primary |
| `estudio_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `convite_id` | `uuid` | Nullable, Unique |
| `modelo` | `contrato_modelo` |  |
| `percentual_estudio` | `numeric` | Nullable |
| `valor_fixo` | `numeric` | Nullable |
| `periodicidade` | `contrato_periodicidade` | Nullable |
| `observacoes` | `varchar` | Nullable |
| `status` | `contrato_status` |  |
| `data_criacao` | `timestamptz` |  |
| `data_resposta` | `timestamptz` | Nullable |
| `data_encerramento` | `timestamptz` | Nullable |

## Table `convites_estudio`

Convites de um estúdio para um tatuador entrar na equipe. No máximo 1 convite `pendente` por par estúdio–tatuador. O convite carrega o contrato proposto (`contratos_colaborador.convite_id`): aceitar vincula o tatuador ao estúdio, ativa esse contrato e cancela os outros convites pendentes dele.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `convite_id` | `uuid` | Primary |
| `estudio_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `status` | `convite_status` |  |
| `data_criacao` | `timestamptz` |  |
| `data_resposta` | `timestamptz` | Nullable |

## Table `enderecos`

Endereços polimórficos (`owner_type` + `owner_id`: cliente, estúdio ou tatuador) com latitude/longitude simples, usadas na busca por proximidade (fórmula de Haversine no `ArtistRepository`). Sem PostGIS (removido pela migration `remove_postgis`). O CEP é gravado como `00000-000` e a UF em maiúsculas. Na busca, o tatuador de estúdio usa o endereço do estúdio; o autônomo, o próprio. Latitude e longitude vêm juntas ou nenhuma (`chk_lat_lng`).

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `endereco_id` | `uuid` | Primary |
| `owner_id` | `uuid` |  |
| `owner_type` | `endereco_owner_type` |  |
| `cep` | `varchar` |  |
| `logradouro` | `varchar` |  |
| `numero` | `varchar` | Nullable |
| `complemento` | `varchar` | Nullable |
| `bairro` | `varchar` | Nullable |
| `cidade` | `varchar` |  |
| `uf` | `bpchar` |  |
| `latitude` | `numeric` | Nullable |
| `longitude` | `numeric` | Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `estilos`

Catálogo controlado de estilos de tatuagem. Não é limpo pelas migrations: a seed só roda no ambiente local, então os bancos remotos dependem do catálogo existente.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `estilo_id` | `uuid` | Primary |
| `nome` | `varchar` | Unique |
| `descricao` | `text` | Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `estudios`

Estabelecimentos de tatuagem. `posicoes` é a quantidade de macas/bancadas (1 a 50), usada na agenda do estúdio por posição.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `estudio_id` | `uuid` | Primary |
| `nome` | `varchar` |  |
| `cnpj` | `varchar` | Nullable, Unique |
| `telefone` | `varchar` | Nullable |
| `data_criacao` | `timestamptz` |  |
| `email` | `varchar` |  |
| `user_id` | `uuid` |  |
| `endereco_id` | `uuid` | Nullable |
| `foto_perfil_url` | `text` | Nullable |
| `posicoes` | `int4` |  |

## Table `horarios_atendimento`

Grade semanal de atendimento. Cada linha é um intervalo de um dia da semana; um dia pode ter mais de um intervalo (ex.: pausa para almoço), sem sobreposição — a regra de sobreposição é validada no `HorarioService`. Cada linha pertence a exatamente um dono (`tatuador_id` ou `estudio_id`, garantido por `chk_horario_dono`); hoje só tatuadores usam, a coluna `estudio_id` fica pronta para o horário do estúdio. `dia_semana` segue a ISO-8601 (1 = segunda … 7 = domingo, igual a `DayOfWeek#getValue`). `fecha > abre`, então expediente que vira a meia-noite não é suportado. Tatuador sem nenhuma linha não tem restrição: o agendamento (`AppointmentService`) só recusa sessões fora da grade de quem cadastrou horário. Alterar a grade não afeta sessões já marcadas

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `horario_id` | `uuid` | Primary |
| `tatuador_id` | `uuid` | Nullable |
| `estudio_id` | `uuid` | Nullable |
| `dia_semana` | `int2` |  |
| `abre` | `time` |  |
| `fecha` | `time` |  |
| `data_criacao` | `timestamptz` |  |

## Table `mensagens`

Mensagens de um chat. Cada mensagem tem texto, imagem (`imagem_url`, bucket `chat_images`) ou os dois — nunca nenhum (`chk_mensagens_conteudo_ou_imagem`).

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `mensagem_id` | `uuid` | Primary |
| `chat_id` | `uuid` |  |
| `remetente_id` | `uuid` |  |
| `conteudo` | `text` | Nullable |
| `data_envio` | `timestamptz` |  |
| `destinatario_id` | `uuid` |  |
| `imagem_url` | `text` | Nullable |

## Table `portfolio`

Galeria de trabalhos do tatuador (antes `portfolio_imagens`). Toda imagem tem um `estilo_id`: os estilos do tatuador, no perfil e na busca por estilo, são os do portfólio dele — quem não tem portfólio não aparece na busca por estilo. As imagens ficam no bucket `portfolio_images`.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `imagem_id` | `uuid` | Primary |
| `tatuador_id` | `uuid` |  |
| `url` | `varchar` |  |
| `data_upload` | `timestamptz` |  |
| `estilo_id` | `uuid` |  |

## Table `qrcodes`

Tokens únicos para check-in presencial. Ainda não usados pelo backend; mantidos até a decisão sobre o check-in por QR Code.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `qrcode_id` | `uuid` | Primary |
| `reserva_id` | `uuid` | Unique |
| `token` | `varchar` | Unique |
| `utilizado` | `bool` |  |
| `data_uso` | `timestamptz` | Nullable |
| `data_expiracao` | `timestamptz` |  |
| `data_criacao` | `timestamptz` |  |

## Table `reservas`

Sessões agendadas de um serviço (`servico_id`, antes `orcamento_id`). `posicao` só é usada quando o tatuador é de um estúdio, e não pode colidir com outra reserva da equipe na mesma posição.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `reserva_id` | `uuid` | Primary |
| `servico_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `cliente_id` | `uuid` |  |
| `data_sessao` | `timestamptz` |  |
| `duracao_min` | `int4` |  |
| `status` | `reserva_status` |  |
| `observacoes` | `text` | Nullable |
| `data_criacao` | `timestamptz` |  |
| `posicao` | `int4` | Nullable |

## Table `servicos`

Trabalhos fechados entre cliente e tatuador; cada um tem uma ou mais sessões em `reservas`. `estudio_id` é o estúdio em que o tatuador estava ao fechar o trabalho: não muda depois e é a base do dashboard do estúdio (nulo para autônomo). A avaliação do cliente fica no próprio serviço: `avaliacao_nota` (1 a 5), `avaliacao_comentario` e `avaliacao_data` — nota e data andam juntas.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `servico_id` | `uuid` | Primary |
| `chat_id` | `uuid` | Nullable |
| `tatuador_id` | `uuid` |  |
| `cliente_id` | `uuid` |  |
| `descricao` | `text` | Nullable |
| `tamanho_cm` | `numeric` | Nullable |
| `local_corpo` | `varchar` | Nullable |
| `arte_final_url` | `varchar` | Nullable |
| `valor_total` | `numeric` |  |
| `valor_sinal` | `numeric` |  |
| `finalizado` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `data_finalizacao` | `timestamptz` | Nullable |
| `status` | `varchar` |  |
| `estudio_id` | `uuid` | Nullable |
| `avaliacao_nota` | `int2` | Nullable |
| `avaliacao_comentario` | `text` | Nullable |
| `avaliacao_data` | `timestamptz` | Nullable |

## Table `tatuadores`

Perfil profissional do tatuador. `estudio_id` é o estúdio atual (nulo para autônomo) e `endereco_id` o endereço próprio.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `tatuador_id` | `uuid` | Primary |
| `user_id` | `uuid` | Unique |
| `estudio_id` | `uuid` | Nullable |
| `bio` | `text` | Nullable |
| `instagram` | `varchar` | Nullable |
| `vinculado_estudio` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `foto_perfil_url` | `varchar` | Nullable |
| `endereco_id` | `uuid` | Nullable |

## Table `users`

Base de autenticação de clientes, tatuadores, estúdios e admins. Será substituída pelo Supabase Auth na etapa 2 da reestruturação do banco.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `nome` | `varchar` |  |
| `email` | `varchar` | Unique |
| `senha_hash` | `varchar` |  |
| `telefone` | `varchar` | Nullable |
| `data_nasc` | `date` | Nullable |
| `cpf` | `varchar` | Nullable, Unique |
| `role` | `user_role` |  |
| `status_ativo` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `data_modificacao` | `timestamptz` |  |
| `termos_aceitos` | `bool` |  |
