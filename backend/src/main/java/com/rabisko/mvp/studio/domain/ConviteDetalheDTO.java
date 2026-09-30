package com.rabisko.mvp.studio.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConviteDetalheDTO(
        UUID conviteId,
        ConviteStatus status,
        LocalDateTime dataCriacao,
        UUID estudioId,
        String nomeEstudio,
        String fotoEstudioUrl,
        UUID tatuadorId,
        String nomeTatuador,
        String fotoTatuadorUrl
) {}

