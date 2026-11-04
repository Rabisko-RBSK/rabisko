-- Conformidade do CNPJ do estúdio (Receita Federal via BrasilAPI): situação
-- ATIVA e CNAE 9609-2/06. "pendente" = ainda não consultado (API fora do ar);
-- "irregular" = era conforme e uma nova consulta mostrou que deixou de ser.

create type public.cnpj_status as enum ('verificado', 'pendente', 'irregular');

alter table public.estudios
    add column cnpj_status       public.cnpj_status not null default 'pendente',
    add column cnpj_situacao     varchar(30),
    add column cnpj_verificado_em timestamptz;