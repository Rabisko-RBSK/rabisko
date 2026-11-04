-- Etapa 3 da reestruturação do banco: todo atendimento acontece num estúdio.
-- O tatuador se liga ao estúdio só por contrato (colaborador ou "dono", o
-- estúdio próprio); endereço e horário são do estúdio; a agenda (reservas)
-- se liga ao estúdio e ao serviço, e cliente/tatuador vêm do serviço.
-- O valor 'dono' do enum contrato_modelo vem da migration anterior
-- (20261101013232_etapa3_enum_dono.sql): o Postgres não deixa usar um valor
-- novo de enum na mesma transação que o criou.
-- Os ambientes só têm dados de teste. "estilos" NÃO é limpa: é o catálogo,
-- e a seed não roda nos bancos remotos.

-- 1. Limpeza --------------------------------------------------------------
-- As contas do Supabase Auth saem junto: sem isso, ficariam contas sem perfil,
-- e o e-mail não poderia ser cadastrado de novo.
delete from auth.users;

truncate table
    public.clientes, public.tatuadores, public.estudios,
    public.enderecos, public.horarios_atendimento,
    public.convites_estudio, public.contratos_colaborador,
    public.chats, public.mensagens,
    public.servicos, public.reservas, public.qrcodes,
    public.portfolio
cascade;

-- 2. QR code sai, por enquanto ---------------------------------------------
drop table public.qrcodes;

-- 3. Contratos -------------------------------------------------------------
-- "dono" não tem valores: o estúdio é do próprio tatuador.
alter table public.contratos_colaborador
    drop constraint chk_contrato_campos,
    add constraint chk_contrato_campos check (
        (modelo = 'comissao'
            and percentual_estudio between 0 and 100
            and valor_fixo is null and periodicidade is null)
        or (modelo in ('aluguel', 'salario')
            and valor_fixo > 0 and periodicidade is not null
            and percentual_estudio is null)
        or (modelo = 'dono'
            and percentual_estudio is null and valor_fixo is null and periodicidade is null)
    );

-- O tatuador atende num estúdio só: no máximo um contrato de colaborador
-- ativo e no máximo um estúdio próprio.
create unique index uq_colaborador_ativo_por_tatuador
    on public.contratos_colaborador (tatuador_id)
    where status = 'ativo' and modelo <> 'dono';

create unique index uq_dono_ativo_por_tatuador
    on public.contratos_colaborador (tatuador_id)
    where status = 'ativo' and modelo = 'dono';

-- 4. Reservas: só estúdio e serviço ----------------------------------------
-- Toda sessão acontece num estúdio, numa posição (todo estúdio tem ao menos 1).
alter table public.reservas
    add column estudio_id uuid not null references public.estudios(estudio_id) on delete cascade,
    alter column posicao set not null,
    drop constraint chk_reservas_posicao,
    add constraint chk_reservas_posicao check (posicao >= 1),
    drop column tatuador_id,
    drop column cliente_id;

create index idx_reservas_estudio_data on public.reservas (estudio_id, data_sessao);

-- 5. Serviços: com estilo, sem estúdio -------------------------------------
-- O estúdio do serviço é o das reservas dele.
alter table public.servicos
    add column estilo_id uuid not null references public.estilos(estilo_id),
    drop column estudio_id;

create index idx_servicos_estilo on public.servicos (estilo_id);

-- 6. Tatuadores: estúdio só por contrato, sem endereço próprio -------------
alter table public.tatuadores
    drop constraint chk_vinculo_estudio,
    drop column estudio_id,
    drop column vinculado_estudio,
    drop column endereco_id;

-- 7. Horários: só do estúdio -----------------------------------------------
alter table public.horarios_atendimento
    drop constraint chk_horario_dono,
    drop column tatuador_id,
    alter column estudio_id set not null;

-- 8. Endereços: só do estúdio, ligado por estudios.endereco_id -------------
alter table public.enderecos
    drop column owner_id,
    drop column owner_type;

drop type public.endereco_owner_type;

-- 9. FKs duplicadas --------------------------------------------------------
-- Ficam as de cascade (chats_*_fkey, mensagens_chat_id_fkey).
alter table public.chats
    drop constraint fk_chats_cliente,
    drop constraint fk_chats_tatuador;

alter table public.mensagens
    drop constraint fk_mensagens_chat;

-- 10. Functions do dashboard -----------------------------------------------
-- Um serviço é do estúdio quando tem reserva nele; o valor do serviço conta
-- uma vez só, mesmo com várias sessões. A equipe é quem tem contrato ativo no
-- estúdio (inclusive o dono). Assinaturas e retornos não mudam.

create or replace function public.dashboard_estudio_receita_total(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns jsonb
language sql
stable
as $$
    with dias as (
        select p_start_date + i as dia
        from generate_series(0, p_end_date - p_start_date) as i
    ),
    receita as (
        select (s.data_criacao at time zone 'America/Sao_Paulo')::date as dia,
               sum(s.valor_total) as valor
        from public.servicos s
        where exists (
                select 1 from public.reservas r
                where r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
              )
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

create or replace function public.dashboard_estudio_evolucao_receita(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns jsonb
language sql
stable
as $$
    with dias as (
        select p_start_date + i as dia
        from generate_series(0, p_end_date - p_start_date) as i
    ),
    receita as (
        select (s.data_criacao at time zone 'America/Sao_Paulo')::date as dia,
               sum(s.valor_total) as valor
        from public.servicos s
        where exists (
                select 1 from public.reservas r
                where r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
              )
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

create or replace function public.dashboard_estudio_agendamentos(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns table (appointments bigint, "newAppointments" bigint, "recurringAppointments" bigint)
language sql
stable
as $$
    with servicos_estudio as (
        select s.servico_id, s.cliente_id, s.data_criacao
        from public.servicos s
        where exists (
                select 1 from public.reservas r
                where r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
              )
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

create or replace function public.dashboard_estudio_tatuadores(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns table (id uuid, name character varying, appointments bigint, revenue numeric)
language sql
stable
as $$
    with servicos_periodo as (
        select s.servico_id, s.tatuador_id, s.valor_total
        from public.servicos s
        where exists (
                select 1 from public.reservas r
                where r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
              )
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    )
    select t.tatuador_id,
           t.nome,
           count(sp.servico_id),
           coalesce(sum(sp.valor_total), 0)
    from public.tatuadores t
    left join servicos_periodo sp on sp.tatuador_id = t.tatuador_id
    where exists (                      -- equipe atual (inclui o dono)
              select 1 from public.contratos_colaborador c
              where c.tatuador_id = t.tatuador_id
                and c.estudio_id = p_estudio_id
                and c.status = 'ativo'
          )
       or sp.servico_id is not null     -- ex-colaborador com serviço do estúdio no período
    group by t.tatuador_id, t.nome
    order by coalesce(sum(sp.valor_total), 0) desc, t.nome;
$$;

create or replace function public.dashboard_estudio_agenda(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns table (
    id uuid, "artistId" uuid, "clientId" uuid, "clientName" character varying,
    date text, "time" text, value numeric, recurring boolean, status text
)
language sql
stable
as $$
    select r.reserva_id,
           s.tatuador_id,
           s.cliente_id,
           c.nome,
           to_char(r.data_sessao at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
           to_char(r.data_sessao at time zone 'America/Sao_Paulo', 'HH24:MI'),
           s.valor_total,
           exists (
               select 1
               from public.servicos anterior
               where anterior.cliente_id = s.cliente_id
                 and anterior.status::text not in ('cancelada', 'no_show')
                 and anterior.data_criacao < s.data_criacao
                 and exists (
                     select 1 from public.reservas ra
                     where ra.servico_id = anterior.servico_id and ra.estudio_id = p_estudio_id
                 )
           ),
           r.status::text
    from public.reservas r
    join public.servicos s on s.servico_id = r.servico_id
    join public.clientes c on c.cliente_id = s.cliente_id
    where r.estudio_id = p_estudio_id
      and r.status::text <> 'cancelada'
      and r.data_sessao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
      and r.data_sessao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by (r.data_sessao at time zone 'America/Sao_Paulo')::date desc,
             (r.data_sessao at time zone 'America/Sao_Paulo')::time;
$$;
