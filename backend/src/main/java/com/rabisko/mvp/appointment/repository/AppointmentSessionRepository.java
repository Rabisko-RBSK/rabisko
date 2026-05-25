package com.rabisko.mvp.appointment.repository;

import com.rabisko.mvp.appointment.domain.AppointmentSession;
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

    /** Todas as sessões de um cliente (para a tela "Minhas Sessões"). */
    List<AppointmentSession> findByClienteId(UUID clienteId);
}
