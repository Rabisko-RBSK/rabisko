package com.rabisko.mvp.repositories;

import com.rabisko.mvp.domain.appointment.AppointmentSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentSessionRepository extends JpaRepository<AppointmentSession, UUID> {

    /** Todas as sessões de um agendamento (servico_id). */
    List<AppointmentSession> findByAppointmentId(UUID appointmentId);

    /**
     * Sessões do tatuador em uma data específica.
     * Filtra por BETWEEN inicio-do-dia e fim-do-dia do campo `data_sessao`.
     */
    List<AppointmentSession> findByTatuadorIdAndDataSessaoBetween(
        UUID tatuadorId,
        LocalDateTime inicioDia,
        LocalDateTime fimDia
    );
}
