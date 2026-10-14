package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendaProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendamentosProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardTatuadorProjection;
import com.rabisko.mvp.studio.domain.dashboard.PeriodoDashboard;
import com.rabisko.mvp.studio.repository.StudioDashboardRepository;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Dashboard do estudio logado. Cada metodo so resolve o estudio do usuario
 * e chama a function correspondente — nada de agregacao em memoria.
 */
@Service
public class StudioDashboardService {

    @Autowired
    private StudioRepository studioRepository;

    @Autowired
    private StudioDashboardRepository dashboardRepository;

    /** JSON: { revenue, daily: [{ day, value }] } */
    public String receitaTotal(User logado, PeriodoDashboard periodo) {
        return dashboardRepository.receitaTotal(estudioId(logado), periodo.inicio(), periodo.fim());
    }

    public DashboardAgendamentosProjection agendamentos(User logado, PeriodoDashboard periodo) {
        return dashboardRepository.agendamentos(estudioId(logado), periodo.inicio(), periodo.fim());
    }

    /** JSON: { daily: [{ day, value }], peak: { day, value }, average } */
    public String evolucaoReceita(User logado, PeriodoDashboard periodo) {
        return dashboardRepository.evolucaoReceita(estudioId(logado), periodo.inicio(), periodo.fim());
    }

    public List<DashboardTatuadorProjection> tatuadores(User logado, PeriodoDashboard periodo) {
        return dashboardRepository.tatuadores(estudioId(logado), periodo.inicio(), periodo.fim());
    }

    public List<DashboardAgendaProjection> agenda(User logado, PeriodoDashboard periodo) {
        return dashboardRepository.agenda(estudioId(logado), periodo.inicio(), periodo.fim());
    }

    private UUID estudioId(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sem usuario autenticado");
        }
        return studioRepository.findByUserId(user.getUserId())
                .map(Studio::getEstudioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario nao possui perfil de estudio"
                ));
    }
}
