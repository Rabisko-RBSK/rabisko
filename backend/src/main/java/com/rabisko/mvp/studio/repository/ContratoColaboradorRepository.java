package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.ContratoColaborador;
import com.rabisko.mvp.studio.domain.ContratoStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratoColaboradorRepository extends JpaRepository<ContratoColaborador, UUID> {

    Optional<ContratoColaborador> findByEstudioIdAndTatuadorIdAndStatus(UUID estudioId, UUID tatuadorId, ContratoStatus status);

    boolean existsByEstudioIdAndTatuadorIdAndStatus(UUID estudioId, UUID tatuadorId, ContratoStatus status);

    Optional<ContratoColaborador> findByConviteId(UUID conviteId);

    List<ContratoColaborador> findByConviteIdIn(Collection<UUID> conviteIds);

    List<ContratoColaborador> findByEstudioIdAndTatuadorIdInAndStatusIn(UUID estudioId,
                                                                        Collection<UUID> tatuadorIds,
                                                                        Collection<ContratoStatus> status);

    List<ContratoColaborador> findByEstudioIdAndTatuadorIdOrderByDataCriacaoDesc(UUID estudioId, UUID tatuadorId);

    List<ContratoColaborador> findByTatuadorIdOrderByDataCriacaoDesc(UUID tatuadorId);

    @Modifying
    @Query("""
        UPDATE ContratoColaborador c
        SET c.status = :cancelado,
            c.dataResposta = :agora
        WHERE c.tatuadorId = :tatuadorId
          AND c.status = :proposto
          AND c.conviteId IS NOT NULL
          AND c.conviteId <> :conviteAceitoId
        """)
    int cancelarPropostasDeOutrosConvites(@Param("tatuadorId") UUID tatuadorId,
                                          @Param("conviteAceitoId") UUID conviteAceitoId,
                                          @Param("agora") LocalDateTime agora,
                                          @Param("proposto") ContratoStatus proposto,
                                          @Param("cancelado") ContratoStatus cancelado);

    default int cancelarPropostasDeOutrosConvites(UUID tatuadorId, UUID conviteAceitoId, LocalDateTime agora) {
        return cancelarPropostasDeOutrosConvites(tatuadorId, conviteAceitoId, agora,
                ContratoStatus.proposto, ContratoStatus.cancelado);
    }
}