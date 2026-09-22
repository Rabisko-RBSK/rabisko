package com.rabisko.mvp.estilo.domain;

import java.util.UUID;

public record EstiloDTO(
        UUID estiloId,
        String nome
) {
    public static EstiloDTO fromEntity(Estilo e) {
        return new EstiloDTO(e.getEstiloId(), e.getNome());
    }
}
