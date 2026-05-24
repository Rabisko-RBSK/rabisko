package com.rabisko.mvp.domain.avaliacao;

import java.time.LocalDateTime;
import java.util.UUID;

// =====================================================================
// DTO AvaliacaoDTO — resposta de GET /artist/{id}/avaliacoes.
//
// STUB: a tabela `avaliacoes` ainda nao existe no schema do Supabase
// (a feature de avaliacoes ainda nao foi modelada). Por enquanto o
// endpoint devolve lista vazia e a UI mostra "Sem avaliacoes ainda".
//
// Quando a tabela existir, criar a entidade Avaliacao + repository
// que faca JOIN com users pra trazer `remetenteNome`, e popular este
// DTO no service.
//
// Mantem em sync com a interface `Avaliacao` do mobile
// (mobile/src/services/api/avaliacaoService.ts).
// =====================================================================
public record AvaliacaoDTO(
        UUID avaliacaoId,
        UUID remetenteId,
        String remetenteNome,
        int nota,
        String comentario,
        LocalDateTime dataCriacao
) {}
