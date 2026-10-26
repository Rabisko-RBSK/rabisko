-- Etapa 1 da reestruturação do banco: limpeza dos dados de teste, renomes,
-- estilos vindos do portfólio e avaliação dentro do serviço.
-- Os ambientes só têm dados de teste. "estilos" NÃO é limpa: é o catálogo,
-- e a seed não roda nos bancos remotos.

-- 1. Limpeza --------------------------------------------------------------
truncate table
    public.users, public.clientes, public.tatuadores, public.estudios,
    public.enderecos, public.horarios_atendimento,
    public.convites_estudio, public.contratos_colaborador,
    public.chats, public.mensagens,
    public.servicos, public.reservas, public.qrcodes,
    public.portfolio_imagens, public.tatuador_estilos, public.avaliacoes
cascade;

-- 2. reservas.orcamento_id -> servico_id ----------------------------------
alter table public.reservas rename column orcamento_id to servico_id;
alter table public.reservas rename constraint reservas_orcamento_id_fkey to reservas_servico_id_fkey;
alter index public.idx_reservas_orcamento rename to idx_reservas_servico;

-- 3. portfolio_imagens -> portfolio, com estilo obrigatório ---------------
alter table public.portfolio_imagens rename to portfolio;
alter table public.portfolio rename constraint portfolio_imagens_pkey to portfolio_pkey;
alter table public.portfolio rename constraint portfolio_imagens_tatuador_id_fkey to portfolio_tatuador_id_fkey;

-- A tabela está vazia (passo 1), então dá para criar a coluna já NOT NULL.
alter table public.portfolio
    add column estilo_id uuid not null
        references public.estilos(estilo_id) on delete restrict;

-- Busca por estilo: "tatuadores com ao menos uma imagem desse estilo".
create index idx_portfolio_estilo_tatuador on public.portfolio (estilo_id, tatuador_id);

drop table public.tatuador_estilos;

-- 4. Avaliação dentro do serviço ------------------------------------------
alter table public.servicos
    add column avaliacao_nota       smallint,
    add column avaliacao_comentario text,
    add column avaliacao_data       timestamptz,
    add constraint chk_servicos_avaliacao_nota
        check (avaliacao_nota is null or avaliacao_nota between 1 and 5),
    add constraint chk_servicos_avaliacao_completa
        check ((avaliacao_nota is null) = (avaliacao_data is null));

drop function if exists public.media_avaliacoes(uuid);
drop table public.avaliacoes;

-- 5. Enums sem uso ---------------------------------------------------------
drop type if exists public.pagamento_metodo;
drop type if exists public.pagamento_status;
drop type if exists public.pagamento_tipo;
drop type if exists public.chat_status;

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
               join public.tatuadores ta on ta.tatuador_id = anterior.tatuador_id
               where ta.estudio_id = p_estudio_id
                 and anterior.cliente_id = s.cliente_id
                 and anterior.status::text not in ('cancelada', 'no_show')
                 and anterior.data_criacao < s.data_criacao
           ),
           r.status::text
    from public.reservas r
    join public.tatuadores t on t.tatuador_id = r.tatuador_id
    join public.servicos s on s.servico_id = r.servico_id
    join public.clientes c on c.cliente_id = r.cliente_id
    join public.users uc on uc.user_id = c.user_id
    where t.estudio_id = p_estudio_id
      and r.status::text <> 'cancelada'
      and r.data_sessao >= (p_start_date::timestamp at time zone 'America/Sao_Paulo')
      and r.data_sessao <  ((p_end_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    order by (r.data_sessao at time zone 'America/Sao_Paulo')::date desc,
             (r.data_sessao at time zone 'America/Sao_Paulo')::time;
$$;

revoke execute on function public.dashboard_estudio_agenda(uuid, date, date)           from public, anon, authenticated;