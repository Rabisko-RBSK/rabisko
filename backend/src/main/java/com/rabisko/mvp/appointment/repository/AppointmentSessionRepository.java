package com.rabisko.mvp.appointment.repository;

import com.rabisko.mvp.appointment.domain.AppointmentSession;
import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
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

    /** Sessões de vários tatuadores (a equipe de um estúdio) numa janela de tempo. */
    List<AppointmentSession> findByTatuadorIdInAndDataSessaoBetween(
        Collection<UUID> tatuadorIds,
        LocalDateTime inicio,
        LocalDateTime fim
    );

    /** Todas as sessões de um cliente (para a tela "Minhas Sessões"). */
    List<AppointmentSession> findByClienteId(UUID clienteId);

    /**
     * Existe sessão futura, não cancelada, de algum tatuador do estúdio numa
     * posição acima de `posicoes`? Impede reduzir as posições do estúdio
     * deixando reservas numa posição que deixaria de existir.
     */
    @Query("""
        select count(s) > 0 from AppointmentSession s
        where s.tatuadorId in (select a.tatuadorId from Artist a where a.estudioId = :estudioId)
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
