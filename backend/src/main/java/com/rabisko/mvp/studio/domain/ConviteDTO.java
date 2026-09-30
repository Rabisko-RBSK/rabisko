package com.rabisko.mvp.studio.domain;

import java.util.UUID;
import java.time.LocalDateTime;

public record ConviteDTO(
    UUID conviteId,
    UUID estudioId,
    UUID tatuadorId,
    ConviteStatus status,
    LocalDateTime dataCriacao,
    LocalDateTime dataResposta
) {
    public static ConviteDTO from(ConviteEstudio c) {
        return new ConviteDTO(
                c.getConviteId(),
                c.getEstudioId(),
                c.getTatuadorId(),
                c.getStatus(),
                c.getDataCriacao(),
                c.getDataResposta()
        );
    }
}
