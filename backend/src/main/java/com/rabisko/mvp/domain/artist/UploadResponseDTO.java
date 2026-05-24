package com.rabisko.mvp.domain.artist;

// =====================================================================
// DTO UploadResponseDTO — resposta dos endpoints de upload de imagem
// (foto de perfil). Devolve apenas a URL publica que o front grava no
// PATCH /artist/me a seguir.
// =====================================================================
public record UploadResponseDTO(String url) {}
