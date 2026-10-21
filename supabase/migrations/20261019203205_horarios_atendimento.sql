create table public.horarios_atendimento (
    horario_id  uuid primary key default extensions.uuid_generate_v4(),
    tatuador_id uuid references public.tatuadores(tatuador_id) on delete cascade,
    estudio_id  uuid references public.estudios(estudio_id)   on delete cascade,
    dia_semana  smallint not null,
    abre        time not null,
    fecha       time not null,
    data_criacao timestamptz not null default now(),

    constraint chk_horario_dia    check (dia_semana between 1 and 7),
    constraint chk_horario_ordem  check (fecha > abre),
    constraint chk_horario_dono   check (num_nonnulls(tatuador_id, estudio_id) = 1)
);

create index idx_horarios_tatuador on public.horarios_atendimento (tatuador_id) where tatuador_id is not null;