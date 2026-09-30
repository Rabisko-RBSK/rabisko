create type convite_status as enum ('pendente', 'aceito', 'recusado', 'cancelado');

create table public.convites_estudio (
    convite_id    uuid primary key default extensions.uuid_generate_v4(),
    estudio_id    uuid not null references public.estudios(estudio_id) on delete cascade,
    tatuador_id   uuid not null references public.tatuadores(tatuador_id) on delete cascade,
    status        convite_status not null default 'pendente',
    data_criacao  timestamptz not null default now(),
    data_resposta timestamptz
);

create unique index uq_convite_pendente
    on public.convites_estudio (estudio_id, tatuador_id)
    where status = 'pendente';

create index idx_convites_tatuador on public.convites_estudio (tatuador_id, status);