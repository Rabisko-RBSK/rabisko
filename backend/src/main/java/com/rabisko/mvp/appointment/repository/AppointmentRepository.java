package com.rabisko.mvp.appointment.repository;

import com.rabisko.mvp.appointment.domain.Appointment;
import com.rabisko.mvp.appointment.domain.AppointmentStatus;
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

    List<Appointment> findByTatuadorIdAndStatusNotIn(UUID tatuadorId, Collection<AppointmentStatus> excluidos);

    /** Serviços com sessão no estúdio — o estúdio do serviço é o das reservas dele. */
    @Query("""
    SELECT a FROM Appointment a
    WHERE a.status NOT IN :excluidos
      AND EXISTS (
        SELECT 1 FROM AppointmentSession s
        WHERE s.appointmentId = a.appointmentId
          AND s.estudioId = :estudioId
      )
    """)
    List<Appointment> servicosDoEstudio(UUID estudioId, Collection<AppointmentStatus> excluidos);

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
