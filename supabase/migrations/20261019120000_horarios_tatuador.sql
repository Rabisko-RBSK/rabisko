-- Horario de funcionamento semanal do tatuador.
--
--   * Uma linha por dia ABERTO; dia sem linha = fechado.
--   * dia_semana segue a ISO-8601 (1 = segunda ... 7 = domingo), o mesmo
--     numero de java.time.DayOfWeek#getValue.
--   * Horario que vira a meia-noite (ex.: 18:00-02:00) nao e suportado:
--     fecha precisa ser maior que abre.
--   * Pelo menos um dia aberto e exigido pelo backend no cadastro e na edicao;
--     tatuadores anteriores a esta migration ficam sem horario ("Horario nao
--     informado" no app).

create table public.tatuador_horarios (
    horario_id   uuid primary key default extensions.uuid_generate_v4(),
    tatuador_id  uuid not null references public.tatuadores(tatuador_id) on delete cascade,
    dia_semana   smallint not null,
    abre         time not null,
    fecha        time not null,

    constraint chk_tatuador_horarios_dia check (dia_semana between 1 and 7),
    constraint chk_tatuador_horarios_intervalo check (fecha > abre),
    constraint uq_tatuador_horarios_dia unique (tatuador_id, dia_semana)
);

comment on table public.tatuador_horarios is 'Horario de funcionamento semanal do tatuador (uma linha por dia aberto)';
comment on column public.tatuador_horarios.dia_semana is 'ISO-8601: 1 = segunda ... 7 = domingo';
