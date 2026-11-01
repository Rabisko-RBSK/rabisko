-- Dashboard do estúdio: estilos mais procurados no período. Mesma regra das
-- outras dashboard_estudio_*: o serviço é do estúdio quando tem reserva nele,
-- conta uma vez só e fica de fora quando cancelado; o estilo é servicos.estilo_id
-- (etapa 3). percent vai de 0 a 100 sobre o total de serviços do período.

create or replace function public.dashboard_estudio_estilos(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns table (name character varying, count bigint, percent numeric)
language sql
stable
as $$
    with servicos_periodo as (
        select s.estilo_id
        from public.servicos s
        where exists (
                select 1 from public.reservas r
                where r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
              )
          and s.status::text not in ('cancelada', 'no_show')
          and s.data_criacao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
          and s.data_criacao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    )
    select e.nome,
           count(*),
           round(count(*) * 100.0 / sum(count(*)) over (), 1)
    from servicos_periodo sp
    join public.estilos e on e.estilo_id = sp.estilo_id
    group by e.nome
    order by count(*) desc, e.nome;
$$;
