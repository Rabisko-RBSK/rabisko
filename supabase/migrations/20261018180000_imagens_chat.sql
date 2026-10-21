-- Envio de imagens no chat.
--
--   * mensagens.imagem_url: URL publica da imagem anexada (bucket chat_images).
--     Uma mensagem tem texto, imagem ou os dois — nunca nenhum dos dois.
--   * Bucket chat_images: publico, igual aos de perfil/portfolio (o backend
--     devolve URLs /storage/v1/object/public/...). Criado aqui para o remoto
--     tambem receber o bucket sem um `supabase config push`.

alter table public.mensagens
    add column if not exists imagem_url text;

alter table public.mensagens
    drop constraint if exists chk_mensagens_conteudo_ou_imagem;
alter table public.mensagens
    add constraint chk_mensagens_conteudo_ou_imagem
    check (conteudo is not null or imagem_url is not null);

comment on column public.mensagens.imagem_url is 'URL publica da imagem anexada a mensagem (bucket chat_images)';

insert into storage.buckets (id, name, public)
values ('chat_images', 'chat_images', true)
on conflict (id) do nothing;
