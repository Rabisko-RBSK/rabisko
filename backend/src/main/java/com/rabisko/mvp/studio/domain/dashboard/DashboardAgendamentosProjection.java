package com.rabisko.mvp.studio.domain.dashboard;

/** Linha de dashboard_estudio_agendamentos. Mesmo formato do mock do app. */
public interface DashboardAgendamentosProjection {
    Long getAppointments();
    Long getNewAppointments();
    Long getRecurringAppointments();
}
