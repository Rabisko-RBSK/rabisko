-- Dashboard do estúdio: resultados financeiros com a equipe no período. Uma
-- linha por contrato de colaborador ativo em algum momento do período (o
-- "dono" fica de fora), calculado só no trecho em que esteve ativo:
--   * comissão: percentual sobre o valor das sessões realizadas (concluidas)
--     no trecho; valor de uma sessão = valor do serviço dividido entre as
--     sessões não canceladas dele;
--   * aluguel/salário: proporcional aos dias ativos (diária = valor por dia;
--     semanal = valor/7 por dia; mensal = valor/dias do mês por dia).
-- aReceber = comissão ou aluguel (o tatuador paga ao estúdio);
-- aPagar   = salário (o estúdio paga ao tatuador).

create or replace function public.dashboard_estudio_financeiro(
    p_estudio_id uuid, p_start_date date, p_end_date date
)
returns table (
    "contratoId" uuid, "tatuadorId" uuid, nome character varying,
    modelo text, "percentualEstudio" numeric, "valorFixo" numeric, periodicidade text,
    inicio date, fim date, dias integer,
    sessoes bigint, "valorSessoes" numeric,
    "aReceber" numeric, "aPagar" numeric
)
language sql
stable
as $$
    with periodo as (
        select p_start_date::timestamp as ini,
               (p_end_date + 1)::timestamp as fim
    ),
    -- Trecho ativo de cada contrato, em horário de Brasília, recortado pelo
    -- período. Semiaberto [aceite, encerramento): numa renegociação o antigo
    -- termina no mesmo instante em que o novo começa.
    trechos as (
        select c.contrato_id, c.tatuador_id, t.nome, c.modelo::text as modelo,
               c.percentual_estudio, c.valor_fixo, c.periodicidade::text as periodicidade,
               greatest(c.data_resposta at time zone 'America/Sao_Paulo', p.ini) as ini,
               least(coalesce(c.data_encerramento at time zone 'America/Sao_Paulo', p.fim), p.fim) as fim
        from public.contratos_colaborador c
        join public.tatuadores t on t.tatuador_id = c.tatuador_id
        cross join periodo p
        where c.estudio_id = p_estudio_id
          and c.modelo <> 'dono'
          and c.status in ('ativo', 'encerrado')
          and c.data_resposta is not null
    ),
    -- Dias cobrados no aluguel/salário: os dias em que o contrato estava
    -- ativo no FIM do dia. O dia de uma troca é do contrato novo; o antigo
    -- vai até a véspera (o dia do encerramento não é cobrado).
    ativos as (
        select tr.*,
               tr.ini::date as dia_ini,
               tr.fim::date - 1 as dia_fim
        from trechos tr
        where tr.ini < tr.fim
    ),
    sessoes as (
        select a.contrato_id,
               count(*) as qtd,
               sum(s.valor_total / n.total) as valor
        from ativos a
        join public.servicos s on s.tatuador_id = a.tatuador_id
        join public.reservas r on r.servico_id = s.servico_id and r.estudio_id = p_estudio_id
        cross join lateral (
            select count(*) as total from public.reservas r2
            where r2.servico_id = s.servico_id and r2.status <> 'cancelada'
        ) n
        where r.status = 'concluida'
          and (r.data_sessao at time zone 'America/Sao_Paulo') >= a.ini
          and (r.data_sessao at time zone 'America/Sao_Paulo') <  a.fim
        group by a.contrato_id
    ),
    fixos as (
        select a.contrato_id,
               sum(case a.periodicidade
                       when 'diaria'  then a.valor_fixo
                       when 'semanal' then a.valor_fixo / 7
                       else a.valor_fixo / extract(day from date_trunc('month', d) + interval '1 month - 1 day')
                   end) as valor
        from ativos a
        cross join generate_series(a.dia_ini, a.dia_fim, interval '1 day') d
        where a.modelo in ('aluguel', 'salario')
        group by a.contrato_id
    )
    select a.contrato_id, a.tatuador_id, a.nome, a.modelo,
           a.percentual_estudio, a.valor_fixo, a.periodicidade,
           a.dia_ini, a.dia_fim, greatest(a.dia_fim - a.dia_ini + 1, 0),
           coalesce(se.qtd, 0), round(coalesce(se.valor, 0), 2),
           round(case a.modelo
                     when 'comissao' then coalesce(se.valor, 0) * a.percentual_estudio / 100
                     when 'aluguel'  then coalesce(f.valor, 0)
                     else 0
                 end, 2),
           round(case when a.modelo = 'salario' then coalesce(f.valor, 0) else 0 end, 2)
    from ativos a
    left join sessoes se on se.contrato_id = a.contrato_id
    left join fixos f on f.contrato_id = a.contrato_id
    order by a.nome, a.dia_ini;
$$;
