package com.rabisko.mvp.studio.domain;

import java.util.UUID;

// =====================================================================
// DTO StudioDTO — resposta read-only com os dados publicos do Studio.
//
// NAO inclui senha (mora em `users`) nem termosAceitos (idem). Apenas
// o que o front precisa pra exibir um cartao/perfil do estudio.
// =====================================================================
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
