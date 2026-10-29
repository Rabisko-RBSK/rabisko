truncate table public.users, public.clientes, public.tatuadores, public.estudios cascade;

drop function if exists public.tatuadores_proximos(numeric, numeric, numeric);

alter table public.mensagens
    drop constraint fk_mensagens_remetente,
    drop constraint fk_mensagens_destinatario,
    drop constraint mensagens_remetente_id_fkey,
    drop constraint mensagens_destinatario_id_fkey;

alter table public.mensagens
    add constraint mensagens_remetente_id_fkey
        foreign key (remetente_id) references auth.users(id) on delete cascade,
    add constraint mensagens_destinatario_id_fkey
        foreign key (destinatario_id) references auth.users(id) on delete cascade;

alter table public.clientes
    add column auth_id          uuid not null unique references auth.users(id) on delete cascade,
    add column nome             varchar(150) not null,
    add column telefone         varchar(20),
    add column data_nasc        date,
    add column cpf              varchar(14) unique,
    add column termos_aceitos   boolean not null default false,
    add column status_ativo     boolean not null default true,
    add column data_modificacao timestamptz not null default now(),
    add constraint chk_clientes_data_nasc check (data_nasc < current_date);

alter table public.tatuadores
    add column auth_id          uuid not null unique references auth.users(id) on delete cascade,
    add column nome             varchar(150) not null,
    add column telefone         varchar(20),
    add column data_nasc        date,
    add column cpf              varchar(14) unique,
    add column termos_aceitos   boolean not null default false,
    add column status_ativo     boolean not null default true,
    add column data_modificacao timestamptz not null default now(),
    add constraint chk_tatuadores_data_nasc check (data_nasc < current_date);

alter table public.estudios
    add column auth_id          uuid unique references auth.users(id) on delete cascade,
    add column termos_aceitos   boolean not null default false,
    add column status_ativo     boolean not null default true,
    add column data_modificacao timestamptz not null default now(),
    drop column email;

create trigger trg_clientes_modified   before update on public.clientes   for each row execute function public.update_modified_column();
create trigger trg_tatuadores_modified before update on public.tatuadores for each row execute function public.update_modified_column();
create trigger trg_estudios_modified   before update on public.estudios   for each row execute function public.update_modified_column();

create index idx_tatuadores_nome_trgm on public.tatuadores using gin (nome gin_trgm_ops);

drop policy mensagens_select_participants on public.mensagens;

create policy mensagens_select_participants on public.mensagens
    for select
    using (remetente_id = auth.uid() or destinatario_id = auth.uid());

alter table public.clientes   drop column user_id;
alter table public.tatuadores drop column user_id;
alter table public.estudios   drop column user_id;

drop table public.users;
drop type public.user_role;


-- 5. Functions do dashboard que liam nomes de users: agora leem do perfil.
--    Base: as versões de 20261021192147_dashboard_por_estudio_servico.sql (regra
--    da #221), com reservas.servico_id (etapa 1) e o nome vindo de
--    tatuadores.nome / clientes.nome. A agenda da etapa 1 tinha voltado à regra
--    antiga do "recorrente"; esta versão corrige.

create or replace function public.dashboard_estudio_tatuadores(
    p_estudio_id uuid,
    p_start_date date,
    p_end_date   date
) returns table (
    "id"           uuid,
    "name"         varchar,
    "appointments" bigint,
    "revenue"      numeric
)
language sql
stable
security invoker
as $$
    select t.tatuador_id,
           t.nome,
           count(s.servico_id),
           coalesce(sum(s.valor_total), 0)
    from public.tatuadores t
    left join public.servicos s
           on s.tatuador_id = t.tatuador_id
          and s.estudio_id = p_estudio_id
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    where t.estudio_id = p_estudio_id   -- equipe atual
       or s.servico_id is not null      -- ex-colaborador com servico do estudio no periodo
    group by t.tatuador_id, t.nome
    order by coalesce(sum(s.valor_total), 0) desc, t.nome;
$$;


create or replace function public.dashboard_estudio_agenda(
    p_estudio_id uuid,
    p_start_date date,
    p_end_date   date
) returns table (
    "id"         uuid,
    "artistId"   uuid,
    "clientId"   uuid,
    "clientName" varchar,
    "date"       text,
    "time"       text,
    "value"      numeric,
    "recurring"  boolean,
    "status"     text
)
language sql
stable
security invoker
as $$
    select r.reserva_id,
           r.tatuador_id,
           r.cliente_id,
           c.nome,
           to_char(r.data_sessao at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
           to_char(r.data_sessao at time zone 'America/Sao_Paulo', 'HH24:MI'),
           s.valor_total,
           exists (
               select 1
               from public.servicos anterior
               where anterior.estudio_id = p_estudio_id
                 and anterior.cliente_id = s.cliente_id
                 and anterior.status::text not in ('cancelada', 'no_show')
                 and anterior.data_criacao < s.data_criacao
           ),
           r.status::text
    from public.reservas r
    join public.tatuadores t on t.tatuador_id = r.tatuador_id
    join public.servicos s on s.servico_id = r.servico_id
    join public.clientes c on c.cliente_id = r.cliente_id
    where t.estudio_id = p_estudio_id
      and r.status::text <> 'cancelada'
      and r.data_sessao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
      and r.data_sessao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by (r.data_sessao at time zone 'America/Sao_Paulo')::date desc,
             (r.data_sessao at time zone 'America/Sao_Paulo')::time;
$$;


revoke execute on function public.dashboard_estudio_tatuadores(uuid, date, date) from public, anon, authenticated;
revoke execute on function public.dashboard_estudio_agenda(uuid, date, date)     from public, anon, authenticated;
