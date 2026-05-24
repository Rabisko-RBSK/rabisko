package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.portfolio.PortfolioImagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// =====================================================================
// REPOSITORY PortfolioImagemRepository — acesso a `portfolio_imagens`.
//
// `listarPorTatuador` ordena pelo campo manual `ordem` (NULLs por ultimo)
// e desempata por imagem_id pra ter ordenacao deterministica. A tabela
// nao tem coluna de timestamp ainda — se um dia tiver `data_criacao`,
// trocar o tie-breaker.
// =====================================================================
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
