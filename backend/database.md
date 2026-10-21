## Table `avaliacoes`

Avaliações mútuas entre cliente e tatuador após o serviço

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `avaliacao_id` | `uuid` | Primary |
| `reserva_id` | `uuid` |  |
| `remetente_id` | `uuid` |  |
| `destinatario_id` | `uuid` |  |
| `nota` | `int2` |  |
| `comentario` | `text` |  Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `chats`

Conversas entre cliente e tatuador

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `chat_id` | `uuid` | Primary |
| `cliente_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `data_criacao` | `timestamptz` |  |
| `ativo` | `bool` |  |
| `ultima_mensagem_em` | `timestamptz` |  Nullable |

## Table `clientes`

Perfil específico de usuários que contratam tatuagens

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `cliente_id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `dados_pagamento_token` | `varchar` |  Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `contratos_colaborador`

Condições de contrato entre estúdio e tatuador (comissão, aluguel de bancada ou salário). Contratos nunca são editados: renegociar cria um novo `proposto`, e o anterior só vira `encerrado` quando o tatuador aceita. No máximo 1 `ativo` e 1 `proposto` por par estúdio–tatuador. Comissão usa `percentual_estudio` (0–100, sobre o valor bruto do serviço); aluguel e salário usam `valor_fixo` + `periodicidade`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `contrato_id` | `uuid` | Primary |
| `estudio_id` | `uuid` |  |
| `tatuador_id` | `uuid` |  |
| `convite_id` | `uuid` |  Nullable, Unique |
| `modelo` | `contrato_modelo` |  |
| `percentual_estudio` | `numeric` |  Nullable |
| `valor_fixo` | `numeric` |  Nullable |
| `periodicidade` | `contrato_periodicidade` |  Nullable |
| `observacoes` | `varchar` |  Nullable |
| `status` | `contrato_status` |  |
| `data_criacao` | `timestamptz` |  |
| `data_resposta` | `timestamptz` |  Nullable |
| `data_encerramento` | `timestamptz` |  Nullable |

## Table `controle_etapas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `chat_id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `status` | `varchar` |  Nullable |

## Table `enderecos`

Endereços polimórficos com geolocalização (PostGIS)

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `endereco_id` | `uuid` | Primary |
| `owner_id` | `uuid` |  |
| `owner_type` | `endereco_owner_type` |  |
| `cep` | `varchar` |  |
| `logradouro` | `varchar` |  |
| `numero` | `varchar` |  Nullable |
| `complemento` | `varchar` |  Nullable |
| `bairro` | `varchar` |  Nullable |
| `cidade` | `varchar` |  |
| `uf` | `bpchar` |  |
| `latitude` | `numeric` |  Nullable |
| `longitude` | `numeric` |  Nullable |
| `geo_point` | `geography` |  Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `estilos`

Catálogo controlado de estilos de tatuagem

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `estilo_id` | `uuid` | Primary |
| `nome` | `varchar` |  Unique |
| `descricao` | `text` |  Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `estudios`

Estabelecimentos físicos de tatuagem

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `estudio_id` | `uuid` | Primary |
| `nome` | `varchar` |  |
| `cnpj` | `varchar` |  Nullable Unique |
| `telefone` | `varchar` |  Nullable |
| `data_criacao` | `timestamptz` |  |
| `termos_aceitos` | `bool` |  |
| `email` | `varchar` |  |
| `user_id` | `uuid` |  |
| `endereco` | `text` |  Nullable |
| `posicoes` | `int4` |  Default 1, entre 1 e 50 |

## Table `horarios_atendimento`

Grade semanal de atendimento. Cada linha é um intervalo de um dia da semana; um dia pode ter mais de um intervalo (ex.: pausa para almoço), sem sobreposição — a regra de sobreposição é validada no `HorarioService`. Cada linha pertence a exatamente um dono (`tatuador_id` ou `estudio_id`, garantido por `chk_horario_dono`); hoje só tatuadores usam, a coluna `estudio_id` fica pronta para o horário do estúdio. `dia_semana` segue a ISO-8601 (1 = segunda … 7 = domingo, igual a `DayOfWeek#getValue`). `fecha > abre`, então expediente que vira a meia-noite não é suportado. Tatuador sem nenhuma linha não tem restrição: o agendamento (`AppointmentService`) só recusa sessões fora da grade de quem cadastrou horário. Alterar a grade não afeta sessões já marcadas

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `horario_id` | `uuid` | Primary |
| `tatuador_id` | `uuid` |  Nullable |
| `estudio_id` | `uuid` |  Nullable |
| `dia_semana` | `smallint` |  |
| `abre` | `time` |  |
| `fecha` | `time` |  |
| `data_criacao` | `timestamptz` |  |

## Table `mensagens`

Mensagens trocadas dentro de um chat

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `mensagem_id` | `uuid` | Primary |
| `chat_id` | `uuid` |  |
| `remetente_id` | `uuid` |  |
| `conteudo` | `text` |  Nullable |
| `data_envio` | `timestamptz` |  |
| `destinatario_id` | `uuid` |  |

## Table `pagamentos`

Transações financeiras integradas com Mercado Pago

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `pagamento_id` | `uuid` | Primary |
| `reserva_id` | `uuid` |  |
| `cliente_id` | `uuid` |  |
| `valor` | `numeric` |  |
| `metodo` | `pagamento_metodo` |  |
| `status` | `pagamento_status` |  |
| `tipo` | `pagamento_tipo` |  |
| `mp_transaction_id` | `varchar` |  Nullable |
| `mp_payment_url` | `varchar` |  Nullable |
| `data_pagamento` | `timestamptz` |  Nullable |
| `data_criacao` | `timestamptz` |  |

## Table `portfolio_imagens`

Galeria de trabalhos realizados pelo tatuador

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `imagem_id` | `uuid` | Primary |
| `tatuador_id` | `uuid` |  |
| `url` | `varchar` |  |
| `descricao` | `text` |  Nullable |
| `ordem` | `int4` |  Nullable |
| `data_upload` | `timestamptz` |  |

## Table `qrcodes`

Tokens únicos para check-in presencial no estúdio

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `qrcode_id` | `uuid` | Primary |
| `reserva_id` | `uuid` |  Unique |
| `token` | `varchar` |  Unique |
| `utilizado` | `bool` |  |
| `data_uso` | `timestamptz` |  Nullable |
| `data_expiracao` | `timestamptz` |  |
| `data_criacao` | `timestamptz` |  |

## Table `reservas`

Sessões de tatuagem agendadas

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `reserva_id` | `uuid` | Primary |
| `orcamento_id` | `uuid` |  Unique |
| `tatuador_id` | `uuid` |  |
| `cliente_id` | `uuid` |  |
| `data_sessao` | `timestamptz` |  |
| `duracao_min` | `int4` |  |
| `status` | `reserva_status` |  |
| `observacoes` | `text` |  Nullable |
| `data_criacao` | `timestamptz` |  |
| `posicao` | `int4` |  Nullable, >= 1 (posição do estúdio ocupada) |

## Table `servicos`

Propostas de tatuagem em negociação ou finalizadas

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `servico_id` | `uuid` | Primary |
| `chat_id` | `uuid` |  Nullable |
| `tatuador_id` | `uuid` |  |
| `cliente_id` | `uuid` |  |
| `descricao` | `text` |  Nullable |
| `tamanho_cm` | `numeric` |  Nullable |
| `local_corpo` | `varchar` |  Nullable |
| `arte_final_url` | `varchar` |  Nullable |
| `valor_total` | `numeric` |  |
| `valor_sinal` | `numeric` |  |
| `finalizado` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `data_finalizacao` | `timestamptz` |  Nullable |

## Table `simulacoes`

Simulações de tatuagem aplicadas em foto do cliente

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `simulacao_id` | `uuid` | Primary |
| `cliente_id` | `uuid` |  |
| `orcamento_id` | `uuid` |  Nullable |
| `url_foto_corpo` | `varchar` |  |
| `url_tatuagem` | `varchar` |  |
| `url_resultado` | `varchar` |  Nullable |
| `pos_x` | `numeric` |  |
| `pos_y` | `numeric` |  |
| `escala` | `numeric` |  |
| `rotacao` | `numeric` |  |
| `data_criacao` | `timestamptz` |  |

## Table `spatial_ref_sys`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `srid` | `int4` | Primary |
| `auth_name` | `varchar` |  Nullable |
| `auth_srid` | `int4` |  Nullable |
| `srtext` | `varchar` |  Nullable |
| `proj4text` | `varchar` |  Nullable |

## Table `tatuador_estilos`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `tatuador_id` | `uuid` | Primary |
| `estilo_id` | `uuid` | Primary |
| `data_criacao` | `timestamptz` |  |

## Table `tatuadores`

Perfil profissional de tatuadores, vinculados ou não a estúdios

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `tatuador_id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `estudio_id` | `uuid` |  Nullable |
| `bio` | `text` |  Nullable |
| `instagram` | `varchar` |  Nullable |
| `vinculado_estudio` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `endereco` | `varchar` |  Nullable |
| `latitude` | `numeric` |  Nullable |
| `longitude` | `numeric` |  Nullable |
| `foto_perfil_url` | `varchar` |  Nullable |

## Table `users`

Tabela base de autenticação para clientes, tatuadores e admins

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `nome` | `varchar` |  |
| `email` | `varchar` |  Unique |
| `senha_hash` | `varchar` |  |
| `telefone` | `varchar` |  Nullable |
| `data_nasc` | `date` |  Nullable |
| `cpf` | `varchar` |  Nullable Unique |
| `role` | `user_role` |  |
| `status_ativo` | `bool` |  |
| `data_criacao` | `timestamptz` |  |
| `data_modificacao` | `timestamptz` |  |
| `termos_aceitos` | `bool` |  |

