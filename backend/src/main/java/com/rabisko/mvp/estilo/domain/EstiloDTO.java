package com.rabisko.mvp.estilo.domain;

import java.util.UUID;

public record EstiloDTO(
        UUID estiloId,
        String nome,
        /** URL publica da imagem do estilo; null quando nao ha imagem. */
        String imagemUrl
) {
    public static EstiloDTO fromEntity(Estilo e, String imagemUrl) {
        return new EstiloDTO(e.getEstiloId(), e.getNome(), imagemUrl);
    }
}
