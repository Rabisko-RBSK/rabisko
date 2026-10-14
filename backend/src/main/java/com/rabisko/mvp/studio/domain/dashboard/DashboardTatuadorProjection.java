package com.rabisko.mvp.studio.domain.dashboard;

import java.math.BigDecimal;
import java.util.UUID;

/** Linha de dashboard_estudio_tatuadores. Mesmo formato do mock do app. */
public interface DashboardTatuadorProjection {
    UUID getId();
    String getName();
    Long getAppointments();
    BigDecimal getRevenue();
}
