package com.rabisko.mvp.studio.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ContratoDTO(
        UUID contratoId,
        UUID estudioId,
        UUID tatuadorId,
        UUID conviteId,
        ContratoModelo modelo,
        BigDecimal percentualEstudio,
        BigDecimal valorFixo,
        ContratoPeriodicidade periodicidade,
        String observacoes,
        ContratoStatus status,
        LocalDateTime dataCriacao,
        LocalDateTime dataResposta,
        LocalDateTime dataEncerramento
) {
    public static ContratoDTO from(ContratoColaborador c) {
        if (c == null) return null;
        return new ContratoDTO(
                c.getContratoId(), c.getEstudioId(), c.getTatuadorId(), c.getConviteId(),
                c.getModelo(), c.getPercentualEstudio(), c.getValorFixo(), c.getPeriodicidade(),
                c.getObservacoes(), c.getStatus(), c.getDataCriacao(), c.getDataResposta(),
                c.getDataEncerramento()
        );
    }
}
