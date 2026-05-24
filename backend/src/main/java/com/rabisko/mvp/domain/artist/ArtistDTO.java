package com.rabisko.mvp.domain.artist;

import java.util.UUID;

// =====================================================================
// DTO ArtistDTO — resposta read-only com os dados publicos de um Artist.
//
// Usado em endpoints como GET /artist/{id} e listagens. NAO inclui dados
// pessoais (nome/email/cpf/telefone) — esses moram na tabela `users` e
// devem ser obtidos via JOIN ou compostos com UserResponseDTO em um
// wrapper futuro (tipo "ArtistWithUserDTO") quando o front precisar.
// =====================================================================
public record ArtistDTO(
    UUID tatuadorId,
    UUID userId,
    UUID estudioId,
    String bio,
    String instagram,
    String endereco,
    boolean vinculadoEstudio
) {
    /** Conversao Artist -> ArtistDTO (omite campos internos como dataCriacao). */
    public static ArtistDTO from(Artist a) {
        return new ArtistDTO(
            a.getTatuadorId(),
            a.getUserId(),
            a.getEstudioId(),
            a.getBio(),
            a.getInstagram(),
            a.getEndereco(),
            a.isVinculadoEstudio()
        );
    }
}
