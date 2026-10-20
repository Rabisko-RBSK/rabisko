package com.rabisko.mvp.horario.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rabisko.mvp.horario.domain.HorarioAtendimento;

public interface HorarioRepository extends JpaRepository<HorarioAtendimento, UUID>{
    List<HorarioAtendimento> findByTatuadorIdOrderByDiaSemanaAscAbreAsc(UUID tatuadorId);

    void deleteByTatuadorId(UUID tatuadorId);
}
