package com.rabisko.mvp.user.domain;

import java.time.LocalDate;
import java.util.UUID;

public record UserResponseDTO(
    UUID userId,
    String nome,
    String email,
    String telefone,
    LocalDate dataNasc,
    UserRole role
) {
    /**
     * Helper de conversao: User -> UserResponseDTO. Centraliza o mapeamento
     * pra ser usado em qualquer controller que precise devolver dados do User.
     */
    public static UserResponseDTO fromUser(User u) {
        return new UserResponseDTO(
            u.getUserId(),
            u.getNome(),
            u.getEmail(),
            u.getTelefone(),
            u.getDataNasc(),
            u.getRole()
        );
    }
}
