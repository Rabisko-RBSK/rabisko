package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.appointment.Appointment;
import com.rabisko.mvp.domain.appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByChatId(UUID chatId);

    List<Appointment> findByTatuadorIdAndStatusNot(UUID tatuadorId, AppointmentStatus status);

    @Query("""
    SELECT COALESCE(SUM(a.valorTotal), 0)
    FROM Appointment a
    WHERE a.tatuadorId = :tatuadorId
      AND a.status NOT IN ('cancelada', 'no_show')
      AND a.dataCriacao >= :inicioMes
      AND a.dataCriacao <  :inicioProxMes
    """)
    BigDecimal somarValorTotalNoPeriodo(UUID tatuadorId, LocalDateTime inicioMes, LocalDateTime inicioProxMes);

    long countByTatuadorIdAndStatusNotInAndDataCriacaoBetween(
        UUID tatuadorId,
        Collection<AppointmentStatus> excluidos,
        LocalDateTime inicio,
        LocalDateTime fim
    );
}
