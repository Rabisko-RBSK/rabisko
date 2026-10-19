package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.Studio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudioRepository extends JpaRepository<Studio, UUID> {
    Optional<Studio> findByUserId(UUID userId);

    /**
     * Le o estudio com SELECT ... FOR UPDATE. Usado ao criar agendamentos para
     * serializar as reservas do mesmo estudio: sem isso, dois tatuadores
     * poderiam validar e gravar a mesma posicao/horario ao mesmo tempo.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Studio s where s.estudioId = :estudioId")
    Optional<Studio> lockById(@Param("estudioId") UUID estudioId);
}
