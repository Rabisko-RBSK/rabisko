DROP INDEX "public"."idx_avaliacoes_reserva";

DROP INDEX "public"."idx_portfolio_tatuador";

ALTER TABLE "public"."avaliacoes"
  DROP CONSTRAINT "avaliacoes_reserva_id_fkey";

ALTER TABLE "public"."avaliacoes"
  DROP CONSTRAINT "avaliacoes_reserva_id_remetente_id_key";

ALTER TABLE "public"."controle_etapas"
  DROP CONSTRAINT "controle_etapas_chat_id_fkey";

ALTER TABLE "public"."pagamentos"
  DROP CONSTRAINT "pagamentos_cliente_id_fkey";

ALTER TABLE "public"."pagamentos"
  DROP CONSTRAINT "pagamentos_reserva_id_fkey";

ALTER TABLE "public"."simulacoes"
  DROP CONSTRAINT "simulacoes_cliente_id_fkey";

ALTER TABLE "public"."simulacoes"
  DROP CONSTRAINT "simulacoes_orcamento_id_fkey";

ALTER TABLE "public"."avaliacoes"
  DROP COLUMN "reserva_id";

ALTER TABLE "public"."clientes"
  DROP COLUMN "dados_pagamento_token";

ALTER TABLE "public"."estudios"
  DROP COLUMN "endereco";

ALTER TABLE "public"."estudios"
  DROP COLUMN "termos_aceitos";

ALTER TABLE "public"."portfolio_imagens"
  DROP COLUMN "descricao";

ALTER TABLE "public"."portfolio_imagens"
  DROP COLUMN "ordem";

ALTER TABLE "public"."tatuadores"
  DROP COLUMN "endereco";

ALTER TABLE "public"."tatuadores"
  DROP COLUMN "latitude";

ALTER TABLE "public"."tatuadores"
  DROP COLUMN "longitude";

DROP TABLE "public"."controle_etapas";

DROP TABLE "public"."pagamentos";

DROP TABLE "public"."simulacoes";

ALTER TABLE "public"."estudios"
  ADD COLUMN "endereco_id" uuid;

ALTER TABLE "public"."estudios"
  ADD COLUMN "foto_perfil_url" text;

ALTER TABLE "public"."tatuadores"
  ADD COLUMN "endereco_id" uuid;

ALTER TABLE "public"."estudios"
  ADD CONSTRAINT "estudios_endereco_id_fkey" FOREIGN KEY (endereco_id) REFERENCES public.enderecos(endereco_id);

ALTER TABLE "public"."tatuadores"
  ADD CONSTRAINT "tatuadores_endereco_id_fkey" FOREIGN KEY (endereco_id) REFERENCES public.enderecos(endereco_id);
