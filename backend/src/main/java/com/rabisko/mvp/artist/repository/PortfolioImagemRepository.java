package com.rabisko.mvp.artist.repository;

import com.rabisko.mvp.artist.domain.PortfolioImagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortfolioImagemRepository extends JpaRepository<PortfolioImagem, UUID> {

    @Query("""
            SELECT p FROM PortfolioImagem p
            WHERE p.tatuadorId = :tatuadorId
            ORDER BY
                CASE WHEN p.ordem IS NULL THEN 1 ELSE 0 END,
                p.ordem ASC,
                p.imagemId ASC
            """)
    List<PortfolioImagem> listarPorTatuador(@Param("tatuadorId") UUID tatuadorId);

    Optional<PortfolioImagem> findByImagemIdAndTatuadorId(UUID imagemId, UUID tatuadorId);
}
