package com.rabisko.mvp.studio.domain;

import java.util.UUID;

public record ColaboradorDTO(
        UUID tatuadorId,
        String nome,
        String fotoPerfilUrl,
        String instagram
) {}