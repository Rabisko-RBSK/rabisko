package com.rabisko.mvp.appointment.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Ocupação das posições do estúdio do tatuador logado num dia.
 * Tatuador sem estúdio: vinculadoEstudio=false, posicoes=0 e reservas vazias.
 */
public record AgendaEstudioDTO(
    boolean vinculadoEstudio,
    UUID estudioId,
    String nomeEstudio,
    int posicoes,
    LocalDate data,
    List<ReservaPosicaoDTO> reservas
) {
    public static AgendaEstudioDTO semEstudio(LocalDate data) {
        return new AgendaEstudioDTO(false, null, null, 0, data, List.of());
    }
}
