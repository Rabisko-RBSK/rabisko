package com.rabisko.mvp.studio.domain;

import java.util.UUID;

public record StudioDTO(
    UUID estudioId,
    String nome,
    String email,
    String cnpj,
    String telefone,
    String endereco
) {
    public static StudioDTO from(Studio s) {
        return new StudioDTO(
            s.getEstudioId(),
            s.getNome(),
            s.getEmail(),
            s.getCnpj(),
            s.getTelefone(),
            s.getEndereco()
        );
    }
}
