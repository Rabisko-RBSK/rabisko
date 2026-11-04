-- ============================================================================
-- Rabisko — seed de dados iniciais
-- ============================================================================
-- Popula o banco com um conjunto mínimo e consistente de dados para
-- desenvolvimento/local (executado automaticamente por `supabase db reset`,
-- conforme configurado em supabase/config.toml -> [db.seed]).
--
-- Segue o schema após todas as migrations, incluindo a etapa 1 da
-- reestruturação (20261026160729_reestruturacao_etapa1.sql):
--   * estilos do tatuador vêm do portfólio (portfolio.estilo_id); a tabela
--     tatuador_estilos não existe mais;
--   * portfolio_imagens virou portfolio;
--   * reservas.orcamento_id virou reservas.servico_id;
--   * a avaliação do cliente fica no próprio serviço (servicos.avaliacao_*);
--     a tabela avaliacoes não existe mais.
-- a etapa 2 (20261029201015_reestruturacao_etapa2_auth.sql):
--   * a tabela users não existe mais: as contas ficam no Supabase Auth
--     (auth.users + auth.identities) e o papel em app_metadata.role;
--   * nome, telefone, data_nasc, cpf e termos ficam no perfil
--     (clientes/tatuadores/estudios), ligado à conta por auth_id;
--   * mensagens.remetente_id/destinatario_id são ids de auth.users.
-- e a etapa 3 (20261101013257_reestruturacao_etapa3.sql):
--   * o tatuador se liga ao estúdio só por contrato: colaborador ou "dono"
--     (estúdio próprio, sem conta de estúdio: o tatuador gerencia);
--   * endereço e horários são do estúdio;
--   * reservas se ligam ao estúdio (com a posição) e ao serviço; cliente e
--     tatuador vêm do serviço, que tem estilo e não tem mais estúdio;
--   * a tabela qrcodes não existe mais.
--
-- Casos cobertos:
--   * Tinta Negra Studio (login e@e.com, 3 posições): Diego, Filipe e João
--     como colaboradores, cada um com um modelo de contrato;
--   * Carla: dona do próprio estúdio (Ateliê Carla Mendes, 1 posição) e com
--     convite pendente do Tinta Negra;
--   * Rita: tatuadora sem estúdio — não aparece na busca do cliente e não
--     agenda, mas pode ser convidada.
--
-- Todas as contas entram com a senha "senha12345" (bcrypt gerado pelo pgcrypto,
-- que o Supabase Auth aceita). CPFs e CNPJs são válidos; CPFs só com dígitos,
-- como o app envia.
--
-- Todos os IDs são fixos (não gerados via uuid_generate_v4) para que as
-- referências entre tabelas fiquem legíveis e o seed seja idempotente:
-- cada INSERT usa "ON CONFLICT ... DO NOTHING", então rodar o script mais
-- de uma vez não duplica nem quebra dados.
--
-- Convenção de IDs fixos (somente para leitura humana, sem significado real):
--   1xxx.. contas (auth)  2xxx.. clientes       3xxx.. estúdios
--   4xxx.. tatuadores     5xxx.. estilos         6xxx.. endereços
--   7xxx.. portfólio      8xxx.. chats           9xxx.. mensagens
--   axxx.. serviços       bxxx.. reservas        cxxx.. convites
--   dxxx.. contratos      exxx.. horários de atendimento
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
-- contas: Supabase Auth (auth.users + auth.identities)
-- ----------------------------------------------------------------------------
-- O backend cria as contas pelo Admin API, que preenche as duas tabelas; aqui
-- fazemos o mesmo direto no banco. Detalhes que o login exige:
--   * instance_id/aud/role fixos, como o Supabase Auth grava;
--   * colunas de token como '' (NULL quebra o login no Supabase Auth);
--   * email_confirmed_at preenchido (conta já confirmada);
--   * uma identidade "email" por conta (provider_id = id da conta).
-- Inclui as contas dos clientes do dashboard (mais abaixo).
CREATE TEMP TABLE seed_contas (id uuid PRIMARY KEY, email text NOT NULL, papel text NOT NULL) ON COMMIT DROP;

INSERT INTO seed_contas (id, email, papel) VALUES
    ('11111111-1111-1111-1111-111111111101', 'admin@rabisko.com',           'admin'),
    ('11111111-1111-1111-1111-111111111102', 'ana.souza@example.com',       'cliente'),
    ('11111111-1111-1111-1111-111111111103', 'bruno.lima@example.com',      'cliente'),
    ('11111111-1111-1111-1111-111111111104', 'carla.mendes@example.com',    'tatuador'),
    ('11111111-1111-1111-1111-111111111105', 'diego.fernandes@example.com', 'tatuador'),
    ('11111111-1111-1111-1111-111111111106', 'filipe.ribeiro@example.com',  'tatuador'),
    ('11111111-1111-1111-1111-111111111108', 'rita.alves@example.com',      'tatuador'),
    ('cacc1353-c691-49b4-9a66-ce4a73891f3c', 'j@j.com',                     'tatuador'),
    ('996892ee-8209-4874-832d-58077badb2f1', 't@t.com',                     'cliente'),
    ('996892ee-8209-4874-832d-58077badb2f2', 'e@e.com',                     'estudio');

INSERT INTO seed_contas (id, email, papel)
SELECT ('11111111-1111-1111-1111-0000000001' || lpad(c.i::text, 2, '0'))::uuid, c.email, 'cliente'
FROM (VALUES
    (1, 'camila.mendes@example.com'),
    (2, 'rafael.lima@example.com'),
    (3, 'juliana.rocha@example.com'),
    (4, 'marcos.teixeira@example.com'),
    (5, 'patricia.alves@example.com'),
    (6, 'lucas.martins@example.com'),
    (7, 'fernanda.costa@example.com'),
    (8, 'gabriel.nunes@example.com'),
    (9, 'beatriz.ramos@example.com')
) AS c(i, email);

INSERT INTO "auth"."users"
    ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at",
     "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at",
     "confirmation_token", "recovery_token", "email_change_token_new", "email_change")
SELECT '00000000-0000-0000-0000-000000000000', c.id, 'authenticated', 'authenticated', c.email,
       extensions.crypt('senha12345', extensions.gen_salt('bf', 10)), now(),
       jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', c.papel),
       '{}'::jsonb, now(), now(),
       '', '', '', ''
FROM seed_contas c
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "auth"."identities"
    ("provider_id", "user_id", "provider", "identity_data", "last_sign_in_at", "created_at", "updated_at")
SELECT c.id::text, c.id, 'email',
       jsonb_build_object('sub', c.id::text, 'email', c.email, 'email_verified', true, 'phone_verified', false),
       now(), now(), now()
FROM seed_contas c
ON CONFLICT ("provider_id", "provider") DO NOTHING;

-- ----------------------------------------------------------------------------
-- clientes: perfil de quem contrata tatuagens
-- ----------------------------------------------------------------------------
INSERT INTO "public"."clientes"
    ("cliente_id", "auth_id", "nome", "telefone", "data_nasc", "cpf", "termos_aceitos") VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102',
     'Ana Beatriz Souza',   '11988880001', '1996-04-12', '12345000198', true),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103',
     'Bruno Carvalho Lima', '11988880002', '1993-09-23', '12345000279', true),
    ('22222222-2222-2222-2222-222222222203', '996892ee-8209-4874-832d-58077badb2f1',
     'Teste',               '11966660002', '2000-08-25', '12345000350', true)
ON CONFLICT ("cliente_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- enderecos: só de estúdios, ligados por estudios.endereco_id (lat/lng simples;
-- PostGIS/geo_point foram removidos pela migration remove_postgis).
-- ----------------------------------------------------------------------------
INSERT INTO "public"."enderecos"
    ("endereco_id", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "latitude", "longitude") VALUES
    ('66666666-6666-6666-6666-666666666603', '01305-000',
     'Rua Augusta', '500', 'Loja 2', 'Consolação', 'São Paulo', 'SP', -23.5537000, -46.6614900),
    ('66666666-6666-6666-6666-666666666604', '05416-001',
     'Rua Fradique Coutinho', '800', NULL, 'Vila Madalena', 'São Paulo', 'SP', -23.5580000, -46.6890000)
ON CONFLICT ("endereco_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- estudios: estabelecimento físico de tatuagem
--   * Tinta Negra: conta própria de estúdio (login e@e.com), 3 posições;
--   * Ateliê Carla Mendes: estúdio próprio da Carla, sem conta de estúdio
--     (auth_id nulo) — ela gerencia pelo login de tatuadora (contrato "dono").
-- ----------------------------------------------------------------------------
INSERT INTO "public"."estudios"
    ("estudio_id", "auth_id", "nome", "cnpj", "telefone", "posicoes", "endereco_id", "termos_aceitos") VALUES
    ('33333333-3333-3333-3333-333333333301', '996892ee-8209-4874-832d-58077badb2f2',
     'Tinta Negra Studio', '12.345.678/0001-95', '1133330000', 3,
     '66666666-6666-6666-6666-666666666603', true),
    ('33333333-3333-3333-3333-333333333302', NULL,
     'Ateliê Carla Mendes', '23.456.789/0001-95', '11977770001', 1,
     '66666666-6666-6666-6666-666666666604', true)
ON CONFLICT ("estudio_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- tatuadores: perfil profissional (o estúdio vem do contrato)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."tatuadores"
    ("tatuador_id", "auth_id", "nome", "telefone", "data_nasc", "cpf", "termos_aceitos",
     "bio", "instagram") VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111104',
     'Carla Mendes',    '11977770001', '1988-02-15', '23456000120', true,
     'Tatuadora especializada em blackwork e fineline. Atendo no meu ateliê na Vila Madalena.',
     '@carla.tattoo'),
    ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111105',
     'Diego Fernandes', '11977770002', '1991-07-30', '23456000200', true,
     'Tatuador residente do Tinta Negra Studio, focado em realismo e old school.',
     '@diego.ink'),
    ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111106',
     'Filipe Ribeiro',  '11977770003', '1994-11-05', '23456000391', true,
     'Especialista em tatuagem oriental de grande porte, também atuo com aquarela e tribal.',
     '@filipe.oriental'),
    ('cacc1353-c691-49b4-9a66-ce4a73891f3c', 'cacc1353-c691-49b4-9a66-ce4a73891f3c',
     'João Santos',     '11966660001', '1985-03-20', '23456000472', true,
     'Tatuador profissional, com trabalhos que transitam entre o minimalismo e o traço mais pesado.',
     '@joão.santos'),
    ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111108',
     'Rita Alves',      '11977770004', '1999-06-18', '23456000553', true,
     'Tatuadora de fineline procurando um estúdio para atender.',
     '@rita.fineline')
ON CONFLICT ("tatuador_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- horarios_atendimento: grade semanal de cada estúdio
-- (dia_semana ISO: 1 = segunda ... 7 = domingo). Cobre os casos da regra:
--   * Tinta Negra: seg a sex em horário comercial + sábado até a noite;
--   * Ateliê Carla Mendes: um intervalo por dia (ter a sex) + sábado curto.
-- ----------------------------------------------------------------------------
INSERT INTO "public"."horarios_atendimento" ("horario_id", "estudio_id", "dia_semana", "abre", "fecha") VALUES
    -- Tinta Negra: seg a sex 10h-20h, sáb 12h-22h (o app edita um intervalo por dia)
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11', '33333333-3333-3333-3333-333333333301', 1, '10:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee13', '33333333-3333-3333-3333-333333333301', 2, '10:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee15', '33333333-3333-3333-3333-333333333301', 3, '10:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee17', '33333333-3333-3333-3333-333333333301', 4, '10:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee19', '33333333-3333-3333-3333-333333333301', 5, '10:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee21', '33333333-3333-3333-3333-333333333301', 6, '12:00', '22:00'),
    -- Ateliê Carla Mendes: ter a sex 13h-20h, sáb 10h-14h
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', '33333333-3333-3333-3333-333333333302', 2, '13:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', '33333333-3333-3333-3333-333333333302', 3, '13:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', '33333333-3333-3333-3333-333333333302', 4, '13:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', '33333333-3333-3333-3333-333333333302', 5, '13:00', '20:00'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', '33333333-3333-3333-3333-333333333302', 6, '10:00', '14:00')
ON CONFLICT ("horario_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- convites_estudio: convites de estúdios para tatuadores entrarem na equipe
-- ----------------------------------------------------------------------------
INSERT INTO "public"."convites_estudio"
    ("convite_id", "estudio_id", "tatuador_id", "status", "data_criacao", "data_resposta") VALUES
    -- Tinta Negra -> Carla (dona do próprio estúdio): convite ainda aguardando resposta
    ('cccccccc-cccc-cccc-cccc-cccccccccc01',
    '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
    'pendente', now() - interval '1 day', NULL),

    -- Tinta Negra -> Diego: convite aceito (origem do contrato ativo)
    ('cccccccc-cccc-cccc-cccc-cccccccccc02',
    '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402',
    'aceito', now() - interval '120 days', now() - interval '119 days'),

    -- Tinta Negra -> Filipe: convite aceito (origem do contrato ativo)
    ('cccccccc-cccc-cccc-cccc-cccccccccc03',
    '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403',
    'aceito', now() - interval '110 days', now() - interval '109 days')

ON CONFLICT ("convite_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- contratos_colaborador: como cada tatuador se liga a um estúdio
--   * Carla: "dono" do Ateliê Carla Mendes (sem valores) + proposta de
--     comissão no convite pendente do Tinta Negra;
--   * Diego: comissão de 30% (veio do convite);
--   * Filipe: aluguel mensal da posição (veio do convite);
--   * João: salário mensal (contrato sem convite);
--   * Rita: nenhum -> sem estúdio, não atende.
-- ----------------------------------------------------------------------------
INSERT INTO "public"."contratos_colaborador"
    ("contrato_id", "estudio_id", "tatuador_id", "convite_id", "modelo",
     "percentual_estudio", "valor_fixo", "periodicidade", "status", "data_criacao", "data_resposta") VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddd01', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444401',
     NULL, 'dono', NULL, NULL, NULL, 'ativo', now() - interval '200 days', now() - interval '200 days'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd02', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401',
     'cccccccc-cccc-cccc-cccc-cccccccccc01', 'comissao', 25.00, NULL, NULL, 'proposto', now() - interval '1 day', NULL),
    ('dddddddd-dddd-dddd-dddd-dddddddddd03', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402',
     'cccccccc-cccc-cccc-cccc-cccccccccc02', 'comissao', 30.00, NULL, NULL, 'ativo', now() - interval '120 days', now() - interval '119 days'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd04', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403',
     'cccccccc-cccc-cccc-cccc-cccccccccc03', 'aluguel', NULL, 1500.00, 'mensal', 'ativo', now() - interval '110 days', now() - interval '109 days'),
    ('dddddddd-dddd-dddd-dddd-dddddddddd05', '33333333-3333-3333-3333-333333333301', 'cacc1353-c691-49b4-9a66-ce4a73891f3c',
     NULL, 'salario', NULL, 4000.00, 'mensal', 'ativo', now() - interval '100 days', now() - interval '100 days')
ON CONFLICT ("contrato_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- portfolio: galeria de trabalhos de cada tatuador. Cada imagem tem um estilo,
-- e os estilos do tatuador (perfil e busca) são os do portfólio dele:
--   * Carla: Blackwork e Fineline;
--   * Diego: Realismo e Old School;
--   * Filipe: Oriental/Japonês, Aquarela e Tribal;
--   * João: sem portfólio -> não aparece na busca por estilo;
--   * Rita: Fineline, mas sem estúdio -> não aparece na busca do cliente.
-- ----------------------------------------------------------------------------
INSERT INTO "public"."portfolio" ("imagem_id", "tatuador_id", "estilo_id", "url") VALUES
    ('77777777-7777-7777-7777-777777777701', '44444444-4444-4444-4444-444444444401',
     '55555555-5555-5555-5555-555555555504', 'https://picsum.photos/seed/carla1/600/800'),   -- Blackwork
    ('77777777-7777-7777-7777-777777777702', '44444444-4444-4444-4444-444444444401',
     '55555555-5555-5555-5555-555555555505', 'https://picsum.photos/seed/carla2/600/800'),   -- Fineline
    ('77777777-7777-7777-7777-777777777703', '44444444-4444-4444-4444-444444444402',
     '55555555-5555-5555-5555-555555555503', 'https://picsum.photos/seed/diego1/600/800'),   -- Realismo
    ('77777777-7777-7777-7777-777777777704', '44444444-4444-4444-4444-444444444402',
     '55555555-5555-5555-5555-555555555501', 'https://picsum.photos/seed/diego2/600/800'),   -- Old School
    ('77777777-7777-7777-7777-777777777705', '44444444-4444-4444-4444-444444444403',
     '55555555-5555-5555-5555-555555555508', 'https://picsum.photos/seed/filipe1/600/800'),  -- Oriental/Japonês
    ('77777777-7777-7777-7777-777777777706', '44444444-4444-4444-4444-444444444403',
     '55555555-5555-5555-5555-555555555506', 'https://picsum.photos/seed/filipe2/600/800'),  -- Aquarela
    ('77777777-7777-7777-7777-777777777707', '44444444-4444-4444-4444-444444444403',
     '55555555-5555-5555-5555-555555555507', 'https://picsum.photos/seed/filipe3/600/800'),  -- Tribal
    ('77777777-7777-7777-7777-777777777708', '44444444-4444-4444-4444-444444444404',
     '55555555-5555-5555-5555-555555555505', 'https://picsum.photos/seed/rita1/600/800')     -- Fineline
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
-- servicos: propostas/orçamentos em negociação ou finalizados (cada um com estilo;
-- o estúdio é o das reservas)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."servicos"
    ("servico_id", "chat_id", "tatuador_id", "cliente_id", "estilo_id", "descricao", "tamanho_cm", "local_corpo",
     "valor_total", "valor_sinal", "finalizado", "data_finalizacao", "status") VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '88888888-8888-8888-8888-888888888801',
     '44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555504',
     'Composição blackwork floral no antebraço', 15.0, 'Antebraço direito',
     900.00, 200.00, false, NULL, 'agendada'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '88888888-8888-8888-8888-888888888802',
     '44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222202', '55555555-5555-5555-5555-555555555503',
     'Retrato realista em preto e cinza', 20.0, 'Panturrilha esquerda',
     1500.00, 300.00, true, '2026-08-20 18:00:00-03', 'concluida'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '88888888-8888-8888-8888-888888888803',
     '44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555508',
     'Fechamento de costas com tema oriental (dragão e ondas)', 45.0, 'Costas inteiras',
     4500.00, 900.00, false, NULL, 'confirmada'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', '88888888-8888-8888-8888-888888888801',
     '44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222201', '55555555-5555-5555-5555-555555555505',
     'Fineline minimalista no pulso', 5.0, 'Pulso esquerdo',
     450.00, 100.00, false, NULL, 'confirmada')
ON CONFLICT ("servico_id") DO NOTHING;

-- Avaliação do cliente sobre o serviço finalizado do Diego (nota e data andam
-- juntas: chk_servicos_avaliacao_completa).
UPDATE "public"."servicos"
   SET "avaliacao_nota" = 5,
       "avaliacao_comentario" = 'Retrato ficou idêntico à foto, atendimento impecável.',
       "avaliacao_data" = '2026-08-22 10:00:00-03'
 WHERE "servico_id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02';

-- ----------------------------------------------------------------------------
-- reservas: sessões agendadas a partir de um serviço, num estúdio e posição
-- ----------------------------------------------------------------------------
INSERT INTO "public"."reservas"
    ("reserva_id", "servico_id", "estudio_id", "posicao", "data_criacao", "data_sessao", "duracao_min", "status", "observacoes") VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
     '33333333-3333-3333-3333-333333333301', 1,
     '2026-08-10 09:30:00-03', '2026-08-20 15:00:00-03', 180, 'concluida', 'Sessão realizada sem intercorrências.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
     '33333333-3333-3333-3333-333333333301', 2,
     now() - interval '1 day', now() + interval '5 days', 240, 'confirmada', 'Primeira sessão do fechamento de costas.'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
     '33333333-3333-3333-3333-333333333302', 1,
     now() - interval '2 days', now() + interval '3 days', 60, 'confirmada', 'Sessão no ateliê da Carla.')
ON CONFLICT ("reserva_id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- Dashboard do estúdio: histórico de serviços/sessões da Tinta Negra Studio
-- ----------------------------------------------------------------------------
-- Alimenta as rotas /studio/me/dashboard/** (login: e@e.com). As datas são
-- relativas ao mês corrente (horário de Brasília), para que "Este mês" e
-- "Mês anterior" tenham dados e comparação em qualquer data em que o seed rodar:
--   M-2: 14 serviços | M-1: 18 + 3 de clientes novos | M atual: 12 + 2 de
--   clientes novos, entre os dias 1 e 10 (limitado ao dia de hoje).
-- Um a cada 9 serviços é cancelado (fica fora do dashboard). Cada serviço tem
-- uma sessão em reservas, 3 a 17 dias depois (10 dias para os clientes novos).
-- IDs: contas 11111111-...-0000000001NN (criadas lá em cima, com as demais
-- contas), clientes 22222222-...-0000000001NN, serviços
-- aaaaaaaa-...-00000000KNNN e reservas bbbbbbbb-...-00000000KNNN.

INSERT INTO "public"."clientes" ("cliente_id", "auth_id", "nome", "cpf", "termos_aceitos")
SELECT ('22222222-2222-2222-2222-0000000001' || lpad(c.i::text, 2, '0'))::uuid,
       ('11111111-1111-1111-1111-0000000001' || lpad(c.i::text, 2, '0'))::uuid,
       c.nome, c.cpf, true
FROM (VALUES
    (1, 'Camila Mendes',   '34567000161'),
    (2, 'Rafael Lima',     '34567000242'),
    (3, 'Juliana Rocha',   '34567000323'),
    (4, 'Marcos Teixeira', '34567000404'),
    (5, 'Patricia Alves',  '34567000595'),
    (6, 'Lucas Martins',   '34567000676'),
    (7, 'Fernanda Costa',  '34567000757'),
    (8, 'Gabriel Nunes',   '34567000838'),
    (9, 'Beatriz Ramos',   '34567000919')
) AS c(i, nome, cpf)
ON CONFLICT ("cliente_id") DO NOTHING;

-- Estilo e posição de cada tatuador da equipe nesses serviços: Diego faz
-- realismo na posição 1, Filipe oriental na 2 e João blackwork na 3 (João não
-- tem portfólio, então o estilo do serviço não o coloca na busca).
CREATE TEMP TABLE seed_equipe (tatuador_id uuid PRIMARY KEY, estilo_id uuid NOT NULL, posicao int NOT NULL) ON COMMIT DROP;

INSERT INTO seed_equipe (tatuador_id, estilo_id, posicao) VALUES
    ('44444444-4444-4444-4444-444444444402', '55555555-5555-5555-5555-555555555503', 1),
    ('44444444-4444-4444-4444-444444444403', '55555555-5555-5555-5555-555555555508', 2),
    ('cacc1353-c691-49b4-9a66-ce4a73891f3c', '55555555-5555-5555-5555-555555555504', 3);

WITH hoje AS (
    SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS dia
),
meses AS (
    -- k = 1 (M-2), 2 (M-1), 3 (mês atual); m mantém a mesma distribuição para qualquer mês
    SELECT k, 7 + k AS m, qtd,
           (date_trunc('month', h.dia) - make_interval(months => 3 - k))::date AS inicio,
           CASE WHEN k = 3 THEN LEAST(10, extract(day FROM h.dia)::int)
                ELSE extract(day FROM date_trunc('month', h.dia) - make_interval(months => 2 - k) - interval '1 day')::int
           END AS dias
    FROM hoje h, (VALUES (1, 14), (2, 18), (3, 12)) AS v(k, qtd)
),
recorrentes AS (
    -- clientes: Ana, Bruno, Teste (t@t.com) e Camila..Marcos
    SELECT ms.k, n,
           (array['44444444-4444-4444-4444-444444444402',
                  '44444444-4444-4444-4444-444444444403',
                  'cacc1353-c691-49b4-9a66-ce4a73891f3c'])[1 + (n * 7 + ms.m) % 3] AS tatuador_id,
           (array['22222222-2222-2222-2222-222222222201',
                  '22222222-2222-2222-2222-222222222202',
                  '22222222-2222-2222-2222-222222222203',
                  '22222222-2222-2222-2222-000000000101',
                  '22222222-2222-2222-2222-000000000102',
                  '22222222-2222-2222-2222-000000000103',
                  '22222222-2222-2222-2222-000000000104'])[1 + (n * 3 + ms.m) % 7] AS cliente_id,
           300 + ((n * 37 + ms.m * 11) % 23) * 100 AS valor,
           CASE WHEN n % 9 = 0 THEN 'cancelada' ELSE 'confirmada' END AS status,
           ms.inicio + (n - 1) * ms.dias / ms.qtd AS dia,
           10 + n % 8 AS hora
    FROM meses ms, generate_series(1, 18) AS n
    WHERE n <= ms.qtd
),
novos AS (
    -- primeiro serviço de Patricia..Beatriz no estúdio (contam como "Novos")
    SELECT ms.k, 50 + v.i AS n, v.tatuador_id,
           '22222222-2222-2222-2222-0000000001' || lpad(v.i::text, 2, '0') AS cliente_id,
           v.valor, 'confirmada' AS status,
           ms.inicio + LEAST(v.dia, ms.dias) - 1 AS dia,
           15 AS hora
    FROM meses ms
    JOIN (VALUES
        (2, 5,  4, '44444444-4444-4444-4444-444444444402', 1800),
        (2, 6, 12, '44444444-4444-4444-4444-444444444403', 2200),
        (2, 7, 23, 'cacc1353-c691-49b4-9a66-ce4a73891f3c',  900),
        (3, 8,  3, '44444444-4444-4444-4444-444444444403', 1600),
        (3, 9,  7, 'cacc1353-c691-49b4-9a66-ce4a73891f3c', 1100)
    ) AS v(k, i, dia, tatuador_id, valor) ON v.k = ms.k
)
INSERT INTO "public"."servicos"
    ("servico_id", "tatuador_id", "cliente_id", "estilo_id", "descricao", "valor_total", "status", "data_criacao")
SELECT ('aaaaaaaa-aaaa-aaaa-aaaa-' || lpad((s.k * 1000 + s.n)::text, 12, '0'))::uuid,
       s.tatuador_id::uuid, s.cliente_id::uuid, e.estilo_id,
       'Serviço do histórico do dashboard',
       s.valor, s.status, (s.dia + make_interval(hours => s.hora)) AT TIME ZONE 'America/Sao_Paulo'
FROM (SELECT * FROM recorrentes UNION ALL SELECT * FROM novos) AS s
JOIN seed_equipe e ON e.tatuador_id = s.tatuador_id::uuid
ON CONFLICT ("servico_id") DO NOTHING;

-- Diego, Filipe e João fizeram esses trabalhos no Tinta Negra: o dashboard do
-- estúdio conta pelo estúdio das reservas.
INSERT INTO "public"."reservas"
    ("reserva_id", "servico_id", "estudio_id", "posicao", "data_criacao", "data_sessao", "duracao_min", "status")
SELECT ('bbbbbbbb-bbbb-bbbb-bbbb-' || right(s.servico_id::text, 12))::uuid,
       s.servico_id, '33333333-3333-3333-3333-333333333301'::uuid, e.posicao,
       s.data_criacao, x.data_sessao,
       120 + (x.n % 3) * 60,
       (CASE WHEN s.status = 'cancelada' THEN 'cancelada'
             WHEN x.data_sessao < now() THEN 'concluida'
             ELSE 'confirmada' END)::"public"."reserva_status"
FROM "public"."servicos" s
JOIN seed_equipe e ON e.tatuador_id = s.tatuador_id
CROSS JOIN LATERAL (
    SELECT right(s.servico_id::text, 3)::int AS n,
           s.data_criacao + CASE WHEN right(s.servico_id::text, 3)::int > 50
                                 THEN interval '10 days'
                                 ELSE make_interval(days => 3 + right(s.servico_id::text, 3)::int % 15, hours => 2)
                            END AS data_sessao
) AS x
WHERE s.servico_id::text LIKE 'aaaaaaaa-aaaa-aaaa-aaaa-0000%'
ON CONFLICT ("reserva_id") DO NOTHING;

-- Histórico já encerrado: o Kanban só põe em "Finalizado" o serviço que o
-- tatuador finalizou (flag finalizado). Os que ainda têm sessão pela frente
-- continuam em andamento.
UPDATE "public"."servicos" s
   SET "finalizado" = true,
       "status" = 'concluida',
       "data_finalizacao" = r.fim
  FROM (SELECT "servico_id", max("data_sessao" + make_interval(mins => "duracao_min")) AS fim
          FROM "public"."reservas"
         WHERE "status" <> 'cancelada'
         GROUP BY "servico_id"
        HAVING max("data_sessao" + make_interval(mins => "duracao_min")) < now()) AS r
 WHERE r."servico_id" = s."servico_id"
   AND s."servico_id"::text LIKE 'aaaaaaaa-aaaa-aaaa-aaaa-0000%'
   AND s."status" <> 'cancelada';

COMMIT;
