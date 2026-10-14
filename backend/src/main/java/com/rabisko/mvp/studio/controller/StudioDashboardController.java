package com.rabisko.mvp.studio.controller;

import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendaProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardAgendamentosProjection;
import com.rabisko.mvp.studio.domain.dashboard.DashboardTatuadorProjection;
import com.rabisko.mvp.studio.domain.dashboard.PeriodoDashboard;
import com.rabisko.mvp.studio.domain.dashboard.PeriodoDashboard.PeriodoInvalidoException;
import com.rabisko.mvp.studio.service.StudioDashboardService;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Dashboard do estudio logado (StudioDashboardScreen). Uma rota por card/grafico.
 *
 * Todas recebem ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD (obrigatorios,
 * inclusivos, horario de Brasilia). O JSON tem o mesmo formato do mock do app.
 */
@RestController
@RequestMapping("/studio/me/dashboard")
public class StudioDashboardController {

    @Autowired
    private StudioDashboardService dashboardService;

    @GetMapping("/receita-total")
    public ResponseEntity<String> receitaTotal(
            @AuthenticationPrincipal User logado,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        PeriodoDashboard periodo = PeriodoDashboard.of(startDate, endDate);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(dashboardService.receitaTotal(logado, periodo));
    }

    @GetMapping("/agendamentos")
    public ResponseEntity<DashboardAgendamentosProjection> agendamentos(
            @AuthenticationPrincipal User logado,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return ResponseEntity.ok(dashboardService.agendamentos(logado, PeriodoDashboard.of(startDate, endDate)));
    }

    @GetMapping("/evolucao-receita")
    public ResponseEntity<String> evolucaoReceita(
            @AuthenticationPrincipal User logado,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        PeriodoDashboard periodo = PeriodoDashboard.of(startDate, endDate);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(dashboardService.evolucaoReceita(logado, periodo));
    }

    @GetMapping("/tatuadores")
    public ResponseEntity<List<DashboardTatuadorProjection>> tatuadores(
            @AuthenticationPrincipal User logado,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return ResponseEntity.ok(dashboardService.tatuadores(logado, PeriodoDashboard.of(startDate, endDate)));
    }

    /** Parcial: sem o campo "style" do mock (nao existe no banco). */
    @GetMapping("/agenda")
    public ResponseEntity<List<DashboardAgendaProjection>> agenda(
            @AuthenticationPrincipal User logado,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        return ResponseEntity.ok(dashboardService.agenda(logado, PeriodoDashboard.of(startDate, endDate)));
    }

    /** 400 com a mensagem no corpo (o handler padrao do Spring esconde a mensagem). */
    @ExceptionHandler(PeriodoInvalidoException.class)
    public ResponseEntity<String> periodoInvalido(PeriodoInvalidoException e) {
        return ResponseEntity.badRequest().contentType(MediaType.TEXT_PLAIN).body(e.getMessage());
    }
}
