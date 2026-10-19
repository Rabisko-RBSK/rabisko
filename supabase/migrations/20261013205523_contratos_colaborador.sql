create type contrato_modelo        as enum ('comissao', 'aluguel', 'salario');
create type contrato_periodicidade as enum ('diaria', 'semanal', 'mensal');
create type contrato_status        as enum ('proposto', 'ativo', 'recusado', 'cancelado', 'encerrado');

create table public.contratos_colaborador (
    contrato_id        uuid primary key default extensions.uuid_generate_v4(),
    estudio_id         uuid not null references public.estudios(estudio_id) on delete cascade,
    tatuador_id        uuid not null references public.tatuadores(tatuador_id) on delete cascade,
    convite_id         uuid references public.convites_estudio(convite_id) on delete set null,
    modelo             contrato_modelo not null,
    percentual_estudio numeric(5,2),
    valor_fixo         numeric(10,2),
    periodicidade      contrato_periodicidade,
    observacoes        varchar(500),
    status             contrato_status not null default 'proposto',
    data_criacao       timestamptz not null default now(),
    data_resposta      timestamptz,
    data_encerramento  timestamptz,

    constraint chk_contrato_campos check (
        (modelo = 'comissao'
            and percentual_estudio between 0 and 100
            and valor_fixo is null and periodicidade is null)
     or (modelo in ('aluguel', 'salario')
            and valor_fixo > 0 and periodicidade is not null
            and percentual_estudio is null)
    )
);

create unique index uq_contrato_ativo    on public.contratos_colaborador (estudio_id, tatuador_id) where status = 'ativo';
create unique index uq_contrato_proposto on public.contratos_colaborador (estudio_id, tatuador_id) where status = 'proposto';
create unique index uq_contrato_convite  on public.contratos_colaborador (convite_id) where convite_id is not null;
create index idx_contratos_tatuador      on public.contratos_colaborador (tatuador_id, status);