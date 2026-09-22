package com.rabisko.mvp.artist.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record AvaliacaoDTO(
        UUID avaliacaoId,
        UUID remetenteId,
        String remetenteNome,
        int nota,
        String comentario,
        LocalDateTime dataCriacao
) {}
