package com.rabisko.mvp.artist.repository;

import com.rabisko.mvp.artist.domain.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortfolioImagemRepository extends JpaRepository<Portfolio, UUID> {

    @Query("""
            SELECT p FROM Portfolio p
            WHERE p.tatuadorId = :tatuadorId
            ORDER BY p.dataUpload DESC, p.imagemId ASC
            """)
    List<Portfolio> listarPorTatuador(@Param("tatuadorId") UUID tatuadorId);

    Optional<Portfolio> findByImagemIdAndTatuadorId(UUID imagemId, UUID tatuadorId);
}
