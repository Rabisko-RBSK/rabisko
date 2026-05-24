package com.rabisko.mvp.domain.artist;

import java.util.UUID;

/**
 * Projecao do Spring Data pra @Query nativa de busca em ArtistRepository.
 * Os getters precisam casar EXATAMENTE com os aliases do SELECT (tatuadorId,
 * nome, email, endereco) — sem isso o Hibernate nao consegue popular.
 */
public interface ArtistSearchProjection {
    UUID getTatuadorId();
    String getNome();
    String getEmail();
    String getEndereco();
}
