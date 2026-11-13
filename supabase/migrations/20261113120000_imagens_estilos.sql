-- Imagens do catálogo de estilos (Home > "Por estilo").
--
--   * estilos.imagem_path: nome do objeto no bucket style_images (ex.:
--     'Realismo.jpeg'). Guardamos só o caminho, não a URL: a base pública muda
--     por ambiente e o backend monta a URL (StorageService.publicUrlEstilo).
--     Nullable: estilo sem imagem cai no placeholder do app.
--   * Bucket style_images: público. Os arquivos ficam em docs/images e sobem
--     via `supabase seed buckets` (objects_path em config.toml); no remoto,
--     `supabase seed buckets --linked`.

alter table public.estilos
    add column if not exists imagem_path text;

comment on column public.estilos.imagem_path is 'Nome do objeto da imagem do estilo no bucket style_images';

insert into storage.buckets (id, name, public)
values ('style_images', 'style_images', true)
on conflict (id) do nothing;

-- Ambientes que já têm o catálogo (o seed local roda depois e traz o valor).
update public.estilos e
set imagem_path = v.imagem_path
from (values
    ('Old School',       'OldSchool.jpeg'),
    ('Realismo',         'Realismo.jpeg'),
    ('Blackwork',        'Blackwork.jpeg'),
    ('Fineline',         'Fineline.jpeg'),
    ('Aquarela',         'Aquarela.jpeg'),
    ('Tribal',           'Tribal.jpeg'),
    ('Oriental/Japonês', 'Oriental.jpeg')
) as v(nome, imagem_path)
where e.nome = v.nome
  and e.imagem_path is null;
