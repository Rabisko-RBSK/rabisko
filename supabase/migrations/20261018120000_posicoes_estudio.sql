-- Posicoes (macas/bancadas) do estudio e a posicao ocupada por cada sessao.
--
--   * estudios.posicoes: quantas posicoes de atendimento o estudio tem. Estudios
--     ja cadastrados ficam com 1 (o minimo para receber agendamentos).
--   * reservas.posicao: em qual posicao (1..posicoes) a sessao acontece. Nullable:
--     sessoes de tatuadores sem estudio, e as criadas antes desta migration, nao
--     ocupam posicao. A sobreposicao por posicao e validada no backend
--     (AppointmentService), que serializa os agendamentos do estudio com lock.

alter table public.estudios
    add column if not exists posicoes integer not null default 1;

alter table public.estudios
    drop constraint if exists chk_estudios_posicoes;
alter table public.estudios
    add constraint chk_estudios_posicoes check (posicoes between 1 and 50);

comment on column public.estudios.posicoes is 'Quantidade de posicoes (macas/bancadas) de atendimento do estudio';

alter table public.reservas
    add column if not exists posicao integer;

alter table public.reservas
    drop constraint if exists chk_reservas_posicao;
alter table public.reservas
    add constraint chk_reservas_posicao check (posicao is null or posicao >= 1);

comment on column public.reservas.posicao is 'Posicao do estudio ocupada pela sessao (1..estudios.posicoes); null quando o tatuador nao tem estudio';
