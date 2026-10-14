package com.rabisko.mvp.studio.domain.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Linha de dashboard_estudio_agenda. Formato do mock do app, sem o campo
 * "style" (o banco nao guarda estilo por servico/reserva).
 */
public interface DashboardAgendaProjection {
    UUID getId();
    UUID getArtistId();
    UUID getClientId();
    String getClientName();
    String getDate();
    String getTime();
    BigDecimal getValue();
    Boolean getRecurring();
    String getStatus();
}
