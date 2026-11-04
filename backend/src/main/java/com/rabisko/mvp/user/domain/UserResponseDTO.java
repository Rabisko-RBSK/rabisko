package com.rabisko.mvp.user.domain;

import java.time.LocalDate;
import java.util.UUID;

public record UserResponseDTO(
    UUID userId,
    String nome,
    String email,
    String telefone,
    LocalDate dataNasc,
    String role,
    UUID estudioProprioId
) {}
