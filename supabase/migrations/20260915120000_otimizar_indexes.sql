-- Estudo de indexes: remove duplicados e cobre colunas de FK/filtro
-- que sao usadas pelo backend (repositorios JPA) mas nao tem indice hoje.

-- =========================================================================
-- 1) Remove indexes/constraints duplicados (mesma definicao, nomes diferentes)
-- =========================================================================

-- chats: duas UNIQUE identicas em (cliente_id, tatuador_id).
-- Mantem "chats_cliente_id_tatuador_id_key" (nome padrao do Postgres/Supabase).
ALTER TABLE "public"."chats" DROP CONSTRAINT IF EXISTS "uk_chat_cliente_tatuador";

-- mensagens: dois indices identicos em (chat_id, data_envio DESC).
DROP INDEX IF EXISTS "public"."idx_mensagens_chat_data";

-- clientes/tatuadores/users/estilos: indice btree simples redundante,
-- ja coberto pela UNIQUE constraint existente na mesma coluna.
DROP INDEX IF EXISTS "public"."idx_clientes_user";
DROP INDEX IF EXISTS "public"."idx_tatuadores_user";
DROP INDEX IF EXISTS "public"."idx_users_email";
DROP INDEX IF EXISTS "public"."idx_estilos_nome";


-- =========================================================================
-- 2) Novos indexes para colunas de FK/filtro sem cobertura hoje
-- =========================================================================

-- chats: ChatService.listarChatsDoUsuario / ArtistService (dashboard) filtram
-- por tatuador_id sozinho, que nao e a coluna lider do indice unico
-- (cliente_id, tatuador_id).
CREATE INDEX IF NOT EXISTS "idx_chats_tatuador"
    ON "public"."chats" USING "btree" ("tatuador_id", "ativo");

-- servicos: AppointmentRepository.somarValorTotalNoPeriodo e
-- countByTatuadorIdAndStatusNotInAndDataCriacaoBetween filtram por
-- tatuador_id + intervalo de data_criacao (dashboard de faturamento).
CREATE INDEX IF NOT EXISTS "idx_servicos_tatuador_data"
    ON "public"."servicos" USING "btree" ("tatuador_id", "data_criacao");

-- reservas: AppointmentSessionRepository.findByAppointmentId filtra por
-- orcamento_id (FK sem indice de apoio desde a criacao da tabela).
CREATE INDEX IF NOT EXISTS "idx_reservas_orcamento"
    ON "public"."reservas" USING "btree" ("orcamento_id");

-- portfolio_imagens: PortfolioImagemRepository.listarPorTatuador e
-- findByImagemIdAndTatuadorId filtram por tatuador_id. O indice antigo
-- (idx_portfolio_tatuador) foi dropado junto da coluna "ordem" na
-- migration 20260906144829 e nunca foi recriado.
CREATE INDEX IF NOT EXISTS "idx_portfolio_tatuador"
    ON "public"."portfolio_imagens" USING "btree" ("tatuador_id");

-- tatuadores/estudios: FKs endereco_id adicionadas na migration
-- 20260906144829 sem indice de apoio.
CREATE INDEX IF NOT EXISTS "idx_tatuadores_endereco"
    ON "public"."tatuadores" USING "btree" ("endereco_id");

CREATE INDEX IF NOT EXISTS "idx_estudios_endereco"
    ON "public"."estudios" USING "btree" ("endereco_id");

-- estudios: FK user_id existe desde a criacao da tabela mas nunca teve
-- indice de apoio (mesmo padrao ja usado em clientes.user_id e
-- tatuadores.user_id).
CREATE INDEX IF NOT EXISTS "idx_estudios_user"
    ON "public"."estudios" USING "btree" ("user_id");
