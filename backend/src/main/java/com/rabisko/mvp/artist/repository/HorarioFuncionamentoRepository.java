package com.rabisko.mvp.artist.repository;

import com.rabisko.mvp.artist.domain.HorarioFuncionamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface HorarioFuncionamentoRepository extends JpaRepository<HorarioFuncionamento, UUID> {

    List<HorarioFuncionamento> findByTatuadorIdOrderByDiaSemanaAsc(UUID tatuadorId);

    /**
     * DELETE em lote, executado na hora. Um deleteBy derivado deixaria o
     * delete para o flush, que roda os INSERTs antes e estouraria o
     * unique (tatuador_id, dia_semana) ao regravar a semana.
     */
    @Modifying
    @Query("DELETE FROM HorarioFuncionamento h WHERE h.tatuadorId = :tatuadorId")
    void apagarDoTatuador(@Param("tatuadorId") UUID tatuadorId);
}
