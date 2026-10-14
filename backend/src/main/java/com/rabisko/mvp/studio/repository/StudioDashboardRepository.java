package com.rabisko.mvp.studio.repository;

import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendaProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendamentosProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardTatuadorProjection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Chamadas das functions dashboard_estudio_* (migration 20261010120000_dashboard_estudio).
 * Toda a agregacao fica no banco; aqui so chamamos a function.
 * As que devolvem jsonb vem como texto e sao repassadas sem transformacao.
 */
public interface StudioDashboardRepository extends Repository<Studio, UUID> {

    @Query(value = "SELECT CAST(public.dashboard_estudio_receita_total(:estudioId, :inicio, :fim) AS text)",
            nativeQuery = true)
    String receitaTotal(@Param("estudioId") UUID estudioId,
                        @Param("inicio") LocalDate inicio,
                        @Param("fim") LocalDate fim);

    @Query(value = "SELECT * FROM public.dashboard_estudio_agendamentos(:estudioId, :inicio, :fim)",
            nativeQuery = true)
    DashboardAgendamentosProjection agendamentos(@Param("estudioId") UUID estudioId,
                                                 @Param("inicio") LocalDate inicio,
                                                 @Param("fim") LocalDate fim);

    @Query(value = "SELECT CAST(public.dashboard_estudio_evolucao_receita(:estudioId, :inicio, :fim) AS text)",
            nativeQuery = true)
    String evolucaoReceita(@Param("estudioId") UUID estudioId,
                           @Param("inicio") LocalDate inicio,
                           @Param("fim") LocalDate fim);

    @Query(value = "SELECT * FROM public.dashboard_estudio_tatuadores(:estudioId, :inicio, :fim)",
            nativeQuery = true)
    List<DashboardTatuadorProjection> tatuadores(@Param("estudioId") UUID estudioId,
                                                 @Param("inicio") LocalDate inicio,
                                                 @Param("fim") LocalDate fim);

    @Query(value = "SELECT * FROM public.dashboard_estudio_agenda(:estudioId, :inicio, :fim)",
            nativeQuery = true)
    List<DashboardAgendaProjection> agenda(@Param("estudioId") UUID estudioId,
                                           @Param("inicio") LocalDate inicio,
                                           @Param("fim") LocalDate fim);
}
