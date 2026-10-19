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
        String fotoTatuadorUrl,
        ContratoDTO contrato
) {
    public ConviteDetalheDTO(UUID conviteId, ConviteStatus status, LocalDateTime dataCriacao,
                             UUID estudioId, String nomeEstudio, String fotoEstudioUrl,
                             UUID tatuadorId, String nomeTatuador, String fotoTatuadorUrl) {
        this(conviteId, status, dataCriacao, estudioId, nomeEstudio, fotoEstudioUrl,
             tatuadorId, nomeTatuador, fotoTatuadorUrl, null);
    }

    public ConviteDetalheDTO withContrato(ContratoDTO contrato) {
        return new ConviteDetalheDTO(conviteId, status, dataCriacao, estudioId, nomeEstudio,
                fotoEstudioUrl, tatuadorId, nomeTatuador, fotoTatuadorUrl, contrato);
    }
}
