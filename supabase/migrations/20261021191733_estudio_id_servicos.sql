alter table public.servicos
    add column estudio_id uuid references public.estudios(estudio_id) on delete set null;

create index idx_servicos_estudio_data
    on public.servicos (estudio_id, data_criacao)
    where estudio_id is not null;

update public.servicos s
   set estudio_id = c.estudio_id
  from public.contratos_colaborador c
 where s.estudio_id is null
   and c.tatuador_id = s.tatuador_id
   and c.status in ('ativo', 'encerrado')
   and s.data_criacao >= c.data_resposta
   and (c.data_encerramento is null or s.data_criacao < c.data_encerramento);

update public.servicos s
   set estudio_id = t.estudio_id
  from public.tatuadores t
  join public.convites_estudio cv
    on cv.tatuador_id = t.tatuador_id and cv.estudio_id = t.estudio_id and cv.status = 'aceito'
 where s.estudio_id is null
   and t.tatuador_id = s.tatuador_id
   and s.data_criacao >= cv.data_resposta;