package com.rabisko.mvp.studio.domain;

import java.util.UUID;

public record StudioDTO(
    UUID estudioId,
    String nome,
    String cnpj,
    String telefone,
    UUID enderecoId,
    String fotoPerfilUrl,
    int posicoes
) {
    public static StudioDTO from(Studio s) {
        return new StudioDTO(
            s.getEstudioId(),
            s.getNome(),
            s.getCnpj(),
            s.getTelefone(),
            s.getEnderecoId(),
            s.getFotoPerfilUrl(),
            s.getPosicoes()
        );
    }
}
