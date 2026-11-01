package com.rabisko.mvp.studio.domain.dashboard;

import java.math.BigDecimal;

/** Linha de dashboard_estudio_estilos. Mesmo formato do grafico do app ({ name, count, percent }). */
public interface DashboardEstiloProjection {
    String getName();
    Long getCount();
    /** Percentual do total de servicos do periodo, de 0 a 100 (1 casa). */
    BigDecimal getPercent();
}
