-- ============================================================================
-- Rabisko — seed de dados iniciais
-- ============================================================================
-- Popula o banco com um conjunto mínimo e consistente de dados para
-- desenvolvimento/local (executado automaticamente por `supabase db reset`,
-- conforme configurado em supabase/config.toml -> [db.seed]).
--
-- Baseado no schema definido em migrations/20260815161135_remote_schema.sql,
-- já considerando as migrations subsequentes 20260906125711_remove_postgis.sql
-- (remoção do PostGIS/geo_point) e 20260906144829_remove_unused_tables.sql
-- (remoção de controle_etapas, pagamentos e simulacoes, e de colunas não
-- utilizadas em avaliacoes/chats/clientes/estudios/portfolio_imagens/tatuadores).
--
-- Todos os IDs são fixos (não gerados via uuid_generate_v4) para que as
-- referências entre tabelas fiquem legíveis e o seed seja idempotente:
-- cada INSERT usa "ON CONFLICT ... DO NOTHING", então rodar o script mais
-- de uma vez não duplica nem quebra dados.
--
-- Convenção de IDs fixos (somente para leitura humana, sem significado real):
--   1xxx.. usuários       2xxx.. clientes        3xxx.. estúdios
--   4xxx.. tatuadores     5xxx.. estilos         6xxx.. endereços
--   7xxx.. portfólio      8xxx.. chats           9xxx.. mensagens
--   axxx.. serviços       bxxx.. reservas        dxxx.. qrcodes
--   exxx.. avaliações
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- estilos: catálogo controlado de estilos de tatuagem
-- ----------------------------------------------------------------------------
INSERT INTO "public"."estilos" ("estilo_id", "nome", "descricao") VALUES
    ('55555555-5555-5555-5555-555555555501', 'Old School',        'Traços grossos, cores vivas e temas clássicos da tatuagem americana.'),
    ('55555555-5555-5555-5555-555555555502', 'New School',        'Evolução exagerada e colorida da old school, com influência de cartoon.'),
    ('55555555-5555-5555-5555-555555555503', 'Realismo',          'Busca reproduzir fotos e texturas com o máximo de fidelidade possível.'),
    ('55555555-5555-5555-5555-555555555504', 'Blackwork',         'Uso predominante de preto sólido, texturas e composições gráficas.'),
    ('55555555-5555-5555-5555-555555555505', 'Fineline',          'Traços finos e delicados, com poucos ou nenhum preenchimento.'),
    ('55555555-5555-5555-5555-555555555506', 'Aquarela',          'Simula o efeito de tinta aquarela, com manchas e transições de cor.'),
    ('55555555-5555-5555-5555-555555555507', 'Tribal',            'Composições gráficas em preto inspiradas em culturas tribais.'),
    ('55555555-5555-5555-5555-555555555508', 'Oriental/Japonês',  'Estilo irezumi: dragões, koi, ondas e grandes composições corporais.')
ON CONFLICT ("estilo_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- users: base de autenticação (clientes, tatuadores e admin)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."users"
    ("user_id", "nome", "email", "senha_hash", "telefone", "data_nasc", "cpf", "role", "status_ativo", "termos_aceitos") VALUES
    ('11111111-1111-1111-1111-111111111101', 'Administrador Rabisko', 'admin@rabisko.com',            '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11999990000', '1990-01-01', '000.000.000-00', 'admin',    true, true),
    ('11111111-1111-1111-1111-111111111102', 'Ana Beatriz Souza',     'ana.souza@example.com',         '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11988880001', '1996-04-12', '111.111.111-11', 'cliente',  true, true),
    ('11111111-1111-1111-1111-111111111103', 'Bruno Carvalho Lima',   'bruno.lima@example.com',        '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11988880002', '1993-09-23', '222.222.222-22', 'cliente',  true, true),
    ('11111111-1111-1111-1111-111111111104', 'Carla Mendes',          'carla.mendes@example.com',      '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11977770001', '1988-02-15', '333.333.333-33', 'tatuador', true, true),
    ('11111111-1111-1111-1111-111111111105', 'Diego Fernandes',       'diego.fernandes@example.com',   '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11977770002', '1991-07-30', '444.444.444-44', 'tatuador', true, true),
    ('11111111-1111-1111-1111-111111111106', 'Filipe Ribeiro',        'filipe.ribeiro@example.com',    '$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11977770003', '1994-11-05', '555.555.555-55', 'tatuador', true, true),
    ('11111111-1111-1111-1111-111111111107', 'Estúdio Tinta Negra',   'contato@tintanegra.example.com','$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11966660000', '1985-03-20', '666.666.666-66', 'tatuador', true, true),
    ('cacc1353-c691-49b4-9a66-ce4a73891f3c', 'João Santos',   'j@j.com','$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11966660001', '1985-03-20', '777.777.777-77', 'tatuador', true, true),
    ('996892ee-8209-4874-832d-58077badb2f1', 'Teste',   't@t.com','$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11966660002', '2000-08-25', '123.456.789-12', 'cliente', true, true),
    ('996892ee-8209-4874-832d-58077badb2f2', 'Estudio teste',   'e@e.com','$2a$10$ulN5jQ9YJacE3Ym9i4hmsO31TaVkdrvbrQgIaAXAU9j4gn29sBHLS', '11966660003', '2000-08-25', '123.456.789-13', 'estudio', true, true)
ON CONFLICT ("user_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- clientes: perfil de quem contrata tatuagens
-- ----------------------------------------------------------------------------
INSERT INTO "public"."clientes" ("cliente_id", "user_id") VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102'), -- Ana
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103'),  -- Bruno
    ('22222222-2222-2222-2222-222222222203', '996892ee-8209-4874-832d-58077badb2f1')  -- Teste
ON CONFLICT ("cliente_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- estudios: estabelecimento físico de tatuagem
-- ----------------------------------------------------------------------------
INSERT INTO "public"."estudios" ("estudio_id", "nome", "cnpj", "telefone", "email", "user_id") VALUES
    ('33333333-3333-3333-3333-333333333301', 'Tinta Negra Studio', '12.345.678/0001-90', '1133330000',
     'contato@tintanegra.example.com', '996892ee-8209-4874-832d-58077badb2f2')
ON CONFLICT ("estudio_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- tatuadores: perfil profissional (independente ou vinculado a estúdio)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."tatuadores"
    ("tatuador_id", "user_id", "estudio_id", "bio", "instagram", "vinculado_estudio") VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111104', NULL,
     'Tatuadora independente especializada em blackwork e fineline. Atendo em estúdio próprio na Vila Madalena.',
     '@carla.tattoo', false),
    ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111105', '33333333-3333-3333-3333-333333333301',
     'Tatuador residente do Tinta Negra Studio, focado em realismo e old school.',
     '@diego.ink', true),
    ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111106', '33333333-3333-3333-3333-333333333301',
     'Especialista em tatuagem oriental de grande porte, também atuo com aquarela e tribal.',
     '@filipe.oriental', true),
    ('cacc1353-c691-49b4-9a66-ce4a73891f3c', 'cacc1353-c691-49b4-9a66-ce4a73891f3c', '33333333-3333-3333-3333-333333333301',
     'Tatuador profissional, com trabalhos que transitam entre o minimalismo e o traço mais pesado.',
     '@joão.santos', true)
ON CONFLICT ("tatuador_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- tatuador_estilos: estilos praticados por cada tatuador
-- ----------------------------------------------------------------------------
INSERT INTO "public"."tatuador_estilos" ("tatuador_id", "estilo_id") VALUES
    ('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555504'), -- Carla: Blackwork
    ('44444444-4444-4444-4444-444444444401', '55555555-5555-5555-5555-555555555505'), -- Carla: Fineline
    ('44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555503'), -- Diego: Realismo
    ('44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555501'), -- Diego: Old School
    ('44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555508'), -- Filipe: Oriental/Japonês
    ('44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555506'), -- Filipe: Aquarela
    ('44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555507')  -- Filipe: Tribal
ON CONFLICT ("tatuador_id", "estilo_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- enderecos: endereços polimórficos (cliente/estúdio) com lat/lng simples
-- (PostGIS/geo_point foram removidos pela migration remove_postgis).
-- ----------------------------------------------------------------------------
INSERT INTO "public"."enderecos"
    ("endereco_id", "owner_id", "owner_type", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "latitude", "longitude") VALUES
    ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'cliente', '05435-000',
     'Rua Harmonia', '200', 'Apto 12', 'Vila Madalena', 'São Paulo', 'SP', -23.5560000, -46.6900000),
    ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222202', 'cliente', '04538-000',
     'Av. Brigadeiro Faria Lima', '1500', NULL, 'Itaim Bibi', 'São Paulo', 'SP', -23.5750000, -46.6850000),
    ('66666666-6666-6666-6666-666666666603', '33333333-3333-3333-3333-333333333301', 'estudio', '01305-000',
     'Rua Augusta', '500', 'Loja 2', 'Consolação', 'São Paulo', 'SP', -23.5537000, -46.6614900)
ON CONFLICT ("endereco_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- portfolio_imagens: galeria de trabalhos de cada tatuador
-- ----------------------------------------------------------------------------
INSERT INTO "public"."portfolio_imagens" ("imagem_id", "tatuador_id", "url") VALUES
    ('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444401', 'https://picsum.photos/seed/carla1/600/800'),
    ('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444401', 'https://picsum.photos/seed/carla2/600/800'),
    ('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444402', 'https://picsum.photos/seed/diego1/600/800'),
    ('77777777-7777-7777-7777-777777777704', '44444444-4444-4444-4444-444444444402', 'https://picsum.photos/seed/diego2/600/800'),
    ('77777777-7777-7777-7777-777777777705', '44444444-4444-4444-4444-444444444403', 'https://picsum.photos/seed/filipe1/600/800'),
    ('77777777-7777-7777-7777-777777777706', '44444444-4444-4444-4444-444444444403', 'https://picsum.photos/seed/filipe2/600/800')
ON CONFLICT ("imagem_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- chats: conversas entre cliente e tatuador
-- ----------------------------------------------------------------------------
INSERT INTO "public"."chats" ("chat_id", "cliente_id","ativo", "tatuador_id") VALUES
    ('88888888-8888-8888-8888-888888888801', '22222222-2222-2222-2222-222222222201', true, '44444444-4444-4444-4444-444444444401'), -- Ana <-> Carla
    ('88888888-8888-8888-8888-888888888802', '22222222-2222-2222-2222-222222222202', true, '44444444-4444-4444-4444-444444444402'), -- Bruno <-> Diego
    ('88888888-8888-8888-8888-888888888803', '22222222-2222-2222-2222-222222222201', true, '44444444-4444-4444-4444-444444444403')  -- Ana <-> Filipe
ON CONFLICT ("chat_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- mensagens: histórico de mensagens de cada chat
-- ----------------------------------------------------------------------------
INSERT INTO "public"."mensagens" ("mensagem_id", "chat_id", "remetente_id", "destinatario_id", "conteudo", "data_envio") VALUES
    ('99999999-9999-9999-9999-999999999901', '88888888-8888-8888-8888-888888888801',
     '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111104',
     'Oi Carla! Gostaria de um orçamento para uma tatuagem blackwork no braço.', now() - interval '3 days'),
    ('99999999-9999-9999-9999-999999999902', '88888888-8888-8888-8888-888888888801',
     '11111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111102',
     'Oi Ana! Claro, me manda uma referência do desenho e o tamanho desejado.', now() - interval '3 days' + interval '2 hours'),

    ('99999999-9999-9999-9999-999999999903', '88888888-8888-8888-8888-888888888802',
     '11111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111105',
     'E aí Diego, curti muito o retrato que você postou. Consigo agendar algo parecido?', '2026-08-10 09:00:00-03'),
    ('99999999-9999-9999-9999-999999999904', '88888888-8888-8888-8888-888888888802',
     '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111103',
     'Consegue sim! Já te mandei o orçamento, foi ótimo te atender.', '2026-08-20 16:30:00-03'),

    ('99999999-9999-9999-9999-999999999905', '88888888-8888-8888-8888-888888888803',
     '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111106',
     'Oi Filipe, quero fechar uma tatuagem oriental de costas inteiras, tem agenda?', now() - interval '1 day'),
    ('99999999-9999-9999-9999-999999999906', '88888888-8888-8888-8888-888888888803',
     '11111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111102',
     'Tenho sim! Já deixei uma sessão confirmada pra gente, te mandei os detalhes.', now() - interval '20 hours')
ON CONFLICT ("mensagem_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- servicos: propostas/orçamentos em negociação ou finalizados
-- ----------------------------------------------------------------------------
INSERT INTO "public"."servicos"
    ("servico_id", "chat_id", "tatuador_id", "cliente_id", "descricao", "tamanho_cm", "local_corpo",
     "valor_total", "valor_sinal", "finalizado", "data_finalizacao", "status") VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '88888888-8888-8888-8888-888888888801',
     '44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201',
     'Composição blackwork floral no antebraço', 15.0, 'Antebraço direito',
     900.00, 200.00, false, NULL, 'EM_NEGOCIACAO'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '88888888-8888-8888-8888-888888888802',
     '44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202',
     'Retrato realista em preto e cinza', 20.0, 'Panturrilha esquerda',
     1500.00, 300.00, true, '2026-08-20 18:00:00-03', 'FINALIZADO'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '88888888-8888-8888-8888-888888888803',
     '44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201',
     'Fechamento de costas com tema oriental (dragão e ondas)', 45.0, 'Costas inteiras',
     4500.00, 900.00, true, NULL, 'ACEITO')
ON CONFLICT ("servico_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- reservas: sessões agendadas a partir de um serviço/orçamento
-- ----------------------------------------------------------------------------
INSERT INTO "public"."reservas"
    ("reserva_id", "orcamento_id", "tatuador_id", "cliente_id", "data_criacao", "data_sessao", "duracao_min", "status", "observacoes") VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
     '44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202',
     '2026-08-10 09:30:00-03', '2026-08-20 15:00:00-03', 180, 'concluida', 'Sessão realizada sem intercorrências.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
     '44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201',
     now() - interval '1 day', '2026-09-25 10:00:00-03', 240, 'confirmada', 'Primeira sessão do fechamento de costas.')
ON CONFLICT ("reserva_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- qrcodes: check-in presencial das reservas
-- ----------------------------------------------------------------------------
INSERT INTO "public"."qrcodes"
    ("qrcode_id", "reserva_id", "token", "utilizado", "data_uso", "data_expiracao", "data_criacao") VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
     'seedtoken0000000000000000000000000000000000000000000000000001', true,
     '2026-08-20 14:50:00-03', '2026-08-20 20:00:00-03', '2026-08-19 09:00:00-03'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
     'seedtoken0000000000000000000000000000000000000000000000000002', false,
     NULL, '2026-09-25 23:59:59-03', now())
ON CONFLICT ("qrcode_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- avaliacoes: avaliações mútuas após sessão concluída (reserva bb01, Bruno<->Diego)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."avaliacoes" ("avaliacao_id", "remetente_id", "destinatario_id", "nota", "comentario") VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
     '11111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111105',
     5, 'Diego é excelente! Resultado ficou incrível e o atendimento foi ótimo do início ao fim.'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
     '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111103',
     5, 'Bruno foi super tranquilo durante a sessão e seguiu certinho os cuidados pós-tattoo.')
ON CONFLICT ("avaliacao_id") DO NOTHING;

COMMIT;
