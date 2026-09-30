package com.rabisko.mvp.studio.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.rabisko.mvp.studio.domain.ConviteDetalheDTO;
import com.rabisko.mvp.studio.domain.ConviteEstudio;
import com.rabisko.mvp.studio.domain.ConviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConviteEstudioRepository extends JpaRepository<ConviteEstudio, UUID> {
    List<ConviteEstudio> findByTatuadorIdAndStatus(UUID tatuadorId, ConviteStatus status);

    List<ConviteEstudio> findByEstudioIdAndStatus(UUID estudioId, ConviteStatus status);

    Optional<ConviteEstudio> findByConviteIdAndTatuadorId(UUID conviteId, UUID tatuadorId);

    boolean existsByEstudioIdAndTatuadorIdAndStatus(UUID estudioId, UUID tatuadorId, ConviteStatus status);

    String SELECT_DETALHE = """
        SELECT new com.rabisko.mvp.studio.domain.ConviteDetalheDTO(
            c.conviteId, c.status, c.dataCriacao,
            s.estudioId, s.nome, s.fotoPerfilUrl,
            t.tatuadorId, u.nome, t.fotoPerfilUrl)
        FROM ConviteEstudio c
        JOIN Studio s ON s.estudioId = c.estudioId
        JOIN Artist t ON t.tatuadorId = c.tatuadorId
        JOIN User u   ON u.userId = t.userId
        """;

    @Query(SELECT_DETALHE + " WHERE c.tatuadorId = :tatuadorId AND c.status = :status ORDER BY c.dataCriacao DESC")
    List<ConviteDetalheDTO> listarDetalhesDoTatuador(@Param("tatuadorId") UUID tatuadorId,
                                                     @Param("status") ConviteStatus status);

    @Query(SELECT_DETALHE + " WHERE c.estudioId = :estudioId AND c.status = :status ORDER BY c.dataCriacao DESC")
    List<ConviteDetalheDTO> listarDetalhesDoEstudio(@Param("estudioId") UUID estudioId,
                                                    @Param("status") ConviteStatus status);

    // Status vão como parâmetros, não como literais do enum: com literal o
    // Hibernate gera 'cancelado'::ConviteStatus (nome da classe), mas o tipo
    // no Postgres é convite_status.
    @Modifying
    @Query("""
        UPDATE ConviteEstudio c
        SET c.status = :cancelado,
            c.dataResposta = :agora
        WHERE c.tatuadorId = :tatuadorId
          AND c.status = :pendente
          AND c.conviteId <> :conviteAceitoId
        """)
    int cancelarOutrosPendentes(@Param("tatuadorId") UUID tatuadorId,
                                @Param("conviteAceitoId") UUID conviteAceitoId,
                                @Param("agora") LocalDateTime agora,
                                @Param("pendente") ConviteStatus pendente,
                                @Param("cancelado") ConviteStatus cancelado);

    default int cancelarOutrosPendentes(UUID tatuadorId, UUID conviteAceitoId, LocalDateTime agora) {
        return cancelarOutrosPendentes(tatuadorId, conviteAceitoId, agora,
                ConviteStatus.pendente, ConviteStatus.cancelado);
    }

}

