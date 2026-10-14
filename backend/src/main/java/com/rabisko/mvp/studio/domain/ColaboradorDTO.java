package com.rabisko.mvp.studio.domain;

import java.util.UUID;

public record ColaboradorDTO(
        UUID tatuadorId,
        String nome,
        String fotoPerfilUrl,
        String instagram,
        ContratoDTO contratoAtivo,
        ContratoDTO contratoProposto
) {
    public ColaboradorDTO(UUID tatuadorId, String nome, String fotoPerfilUrl, String instagram) {
        this(tatuadorId, nome, fotoPerfilUrl, instagram, null, null);
    }

    public ColaboradorDTO withContratos(ContratoDTO ativo, ContratoDTO proposto) {
        return new ColaboradorDTO(tatuadorId, nome, fotoPerfilUrl, instagram, ativo, proposto);
    }
}
