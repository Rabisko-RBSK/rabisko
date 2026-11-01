package com.rabisko.mvp.appointment.repository;

import com.rabisko.mvp.appointment.domain.AppointmentSession;
import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Sessões (tabela `reservas`). A sessão guarda só o estúdio e o serviço:
 * tatuador e cliente vêm do serviço (`Appointment`), por isso as consultas
 * por eles fazem join.
 */
public interface AppointmentSessionRepository extends JpaRepository<AppointmentSession, UUID> {

    /** Todas as sessões de um agendamento (servico_id). */
    List<AppointmentSession> findByAppointmentId(UUID appointmentId);

    /** Sessões do estúdio numa janela de tempo (agenda de posições e conflito de posição). */
    List<AppointmentSession> findByEstudioIdAndDataSessaoBetween(UUID estudioId, LocalDateTime inicio, LocalDateTime fim);

    /** Sessões do tatuador numa janela de tempo, em qualquer estúdio (horários ocupados). */
    @Query("""
        select s from AppointmentSession s
        join Appointment a on a.appointmentId = s.appointmentId
        where a.tatuadorId = :tatuadorId
          and s.dataSessao between :inicio and :fim
        """)
    List<AppointmentSession> sessoesDoTatuadorNoPeriodo(
        @Param("tatuadorId") UUID tatuadorId,
        @Param("inicio") LocalDateTime inicio,
        @Param("fim") LocalDateTime fim
    );

    /** Todas as sessões de um cliente (para a tela "Minhas Sessões"). */
    @Query("""
        select s from AppointmentSession s
        join Appointment a on a.appointmentId = s.appointmentId
        where a.clienteId = :clienteId
        """)
    List<AppointmentSession> sessoesDoCliente(@Param("clienteId") UUID clienteId);

    /**
     * Existe sessão futura, não cancelada, no estúdio numa posição acima de
     * `posicoes`? Impede reduzir as posições do estúdio deixando reservas numa
     * posição que deixaria de existir.
     */
    @Query("""
        select count(s) > 0 from AppointmentSession s
        where s.estudioId = :estudioId
          and s.posicao > :posicoes
          and s.dataSessao >= :agora
          and s.status <> :cancelada
        """)
    boolean existeReservaFuturaAcimaDaPosicao(
        @Param("estudioId") UUID estudioId,
        @Param("posicoes") int posicoes,
        @Param("agora") LocalDateTime agora,
        @Param("cancelada") AppointmentStatus cancelada
    );
}
