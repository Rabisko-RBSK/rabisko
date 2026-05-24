package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.artist.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;


/**
 * Repositorio JPA de Artist (tabela `tatuadores`). Sem queries customizadas
 * por enquanto — JpaRepository ja cobre save/findById/findAll/delete.
 */
public interface ArtistRepository extends JpaRepository<Artist, UUID> {
    Optional<Artist> findByUserId(UUID userId);
}
