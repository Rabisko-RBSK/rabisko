-- Dashboard do estudio passa a contar pelo estudio gravado no servico
-- (servicos.estudio_id, ver 20261021191733_estudio_id_servicos.sql), e nao
-- mais pela equipe ATUAL (tatuadores.estudio_id).
--
-- Efeito: quando um tatuador sai do estudio, os trabalhos que ele fez la
-- continuam nos numeros do estudio; se ele entra em outro estudio, o
-- historico dele nao vai junto. So trabalhos fechados depois da saida
-- deixam de contar.
--
-- Regras por function:
--   * receita_total, evolucao_receita, agendamentos: s.estudio_id = p_estudio_id.
--   * agendamentos (recorrente): cliente ja tinha servico valido COM O ESTUDIO
--     antes deste, mesmo que o tatuador da primeira vez tenha saido.
--   * tatuadores: equipe atual + quem teve servico do estudio no periodo
--     (ex-colaboradores aparecem, senao a soma por tatuador nao bate com a
--     receita total). Receita de cada um conta so servicos do estudio.
--   * agenda: continua pela EQUIPE ATUAL (e operacional: o estudio nao ve
--     sessoes futuras de quem ja saiu). So o "recorrente" usa s.estudio_id.
--
-- As colunas devolvidas nao mudam, entao "create or replace" mantem as
-- permissoes; os revokes no fim sao repetidos so por seguranca.


-- -------------------------------------------------------------------------
-- Card "Receita total": total do periodo + serie diaria do mini-grafico.
-- Formato: { "revenue": number, "daily": [{ "day": number, "value": number }] }
-- -------------------------------------------------------------------------
create or replace function public.dashboard_estudio_receita_total(
    p_estudio_id uuid,
    p_start_date date,
    p_end_date   date
) returns jsonb
language sql
stable
security invoker
as $$
    with dias as (
        select p_start_date + i as dia
        from generate_series(0, p_end_date - p_start_date) as i
    ),
    receita as (
        select (s.data_criacao at time zone 'America/Sao_Paulo')::date as dia,
               sum(s.valor_total) as valor
        from public.servicos s
        where s.estudio_id = p_estudio_id
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
        group by 1
    )
    select jsonb_build_object(
        'revenue', coalesce(sum(r.valor), 0),
        'daily', coalesce(
            jsonb_agg(
                jsonb_build_object('day', extract(day from d.dia)::int, 'value', coalesce(r.valor, 0))
                order by d.dia
            ),
            '[]'::jsonb
        )
    )
    from dias d
    left join receita r on r.dia = d.dia;
$$;


-- -------------------------------------------------------------------------
-- Card "Agendamentos": total, novos e recorrentes no periodo.
-- -------------------------------------------------------------------------
create or replace function public.dashboard_estudio_agendamentos(
    p_estudio_id uuid,
    p_start_date date,
    p_end_date   date
) returns table (
    "appointments"          bigint,
    "newAppointments"       bigint,
    "recurringAppointments" bigint
)
language sql
stable
security invoker
as $$
    with servicos_estudio as (
        select s.servico_id, s.cliente_id, s.data_criacao
        from public.servicos s
        where s.estudio_id = p_estudio_id
          and s.status::text not in ('cancelada', 'no_show')
    ),
    periodo as (
        select se.*,
               exists (
                   select 1
                   from servicos_estudio anterior
                   where anterior.cliente_id = se.cliente_id
                     and anterior.data_criacao < se.data_criacao
               ) as recorrente
        from servicos_estudio se
        where se.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and se.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    )
    select count(*),
           count(*) filter (where not recorrente),
           count(*) filter (where recorrente)
    from periodo;
$$;


-- -------------------------------------------------------------------------
-- Grafico "Evolucao da Receita": serie diaria, dia de pico e media diaria.
-- Formato: { "daily": [{ "day", "value" }], "peak": { "day", "value" }, "average": number }
-- Pico = primeiro dia com a maior receita. Media = receita / dias do periodo.
-- -------------------------------------------------------------------------
create or replace function public.dashboard_estudio_evolucao_receita(
    p_estudio_id uuid,
    p_start_date date,
    p_end_date   date
) returns jsonb
language sql
stable
security invoker
as $$
    with dias as (
        select p_start_date + i as dia
        from generate_series(0, p_end_date - p_start_date) as i
    ),
    receita as (
        select (s.data_criacao at time zone 'America/Sao_Paulo')::date as dia,
               sum(s.valor_total) as valor
        from public.servicos s
        where s.estudio_id = p_estudio_id
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
        group by 1
    ),
    serie as (
        select d.dia, extract(day from d.dia)::int as day, coalesce(r.valor, 0) as value
        from dias d
        left join receita r on r.dia = d.dia
    )
    select jsonb_build_object(
        'daily', coalesce(
            (select jsonb_agg(jsonb_build_object('day', day, 'value', value) order by dia) from serie),
            '[]'::jsonb
        ),
        'peak', (
            select jsonb_build_object('day', day, 'value', value)
            from serie
            order by value desc, dia
            limit 1
        ),
        'average', coalesce(
            (select round(sum(value) / count(*), 2) from serie),
            0
        )
    );
$$;


-- -------------------------------------------------------------------------
-- Lista "Tatuadores": agendamentos e receita de cada tatuador NO ESTUDIO.
-- Inclui a equipe atual (mesmo sem agendamento no periodo) e quem ja saiu
-- mas teve servico do estudio no periodo. Ordem: maior receita.
-- -------------------------------------------------------------------------
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
           u.nome,
           count(s.servico_id),
           coalesce(sum(s.valor_total), 0)
    from public.tatuadores t
    join public.users u on u.user_id = t.user_id
    left join public.servicos s
           on s.tatuador_id = t.tatuador_id
          and s.estudio_id = p_estudio_id
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    where t.estudio_id = p_estudio_id   -- equipe atual
       or s.servico_id is not null      -- ex-colaborador com servico do estudio no periodo
    group by t.tatuador_id, u.nome
    order by coalesce(sum(s.valor_total), 0) desc, u.nome;
$$;


-- -------------------------------------------------------------------------
-- Agenda do estudio: sessoes (reservas) do periodo, por data_sessao.
-- Continua pela EQUIPE ATUAL: e a agenda operacional do espaco.
-- Parcial em relacao ao mock: nao ha "style" (servicos/reservas nao
-- guardam estilo) e "value" e o valor_total do servico, nao da sessao.
-- Ordem igual ao mock: data desc, horario asc. Exclui reservas canceladas.
-- -------------------------------------------------------------------------
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
           uc.nome,
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
    join public.servicos s on s.servico_id = r.orcamento_id
    join public.clientes c on c.cliente_id = r.cliente_id
    join public.users uc on uc.user_id = c.user_id
    where t.estudio_id = p_estudio_id
      and r.status::text <> 'cancelada'
      and r.data_sessao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
      and r.data_sessao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by (r.data_sessao at time zone 'America/Sao_Paulo')::date desc,
             (r.data_sessao at time zone 'America/Sao_Paulo')::time;
$$;


revoke execute on function public.dashboard_estudio_receita_total(uuid, date, date)    from public, anon, authenticated;
revoke execute on function public.dashboard_estudio_agendamentos(uuid, date, date)     from public, anon, authenticated;
revoke execute on function public.dashboard_estudio_evolucao_receita(uuid, date, date) from public, anon, authenticated;
revoke execute on function public.dashboard_estudio_tatuadores(uuid, date, date)       from public, anon, authenticated;
revoke execute on function public.dashboard_estudio_agenda(uuid, date, date)           from public, anon, authenticated;
