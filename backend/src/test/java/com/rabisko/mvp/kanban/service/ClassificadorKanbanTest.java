package com.rabisko.mvp.kanban.service;

import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.kanban.domain.KanbanColuna;
import com.rabisko.mvp.kanban.service.ClassificadorKanban.Sessao;
import com.rabisko.mvp.kanban.service.ClassificadorKanban.Situacao;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ClassificadorKanbanTest {

    private static final LocalDateTime AGORA = LocalDateTime.parse("2026-11-10T12:00");

    private static Sessao sessao(String inicio) {
        return new Sessao(LocalDateTime.parse(inicio), 120);
    }

    private static Situacao classificar(List<Sessao> sessoes) {
        return ClassificadorKanban.doServico(AppointmentStatus.confirmada, sessoes, AGORA);
    }

    @Test
    void nenhumaSessaoComecouEAgendado() {
        Situacao s = classificar(List.of(sessao("2026-11-20T14:00"), sessao("2026-11-13T14:00")));
        assertEquals(KanbanColuna.agendado, s.coluna());
        assertEquals(1, s.sessaoAtual());
        assertEquals(2, s.totalSessoes());
        assertEquals(LocalDateTime.parse("2026-11-13T14:00"), s.proximaSessao());
    }

    @Test
    void sessaoJaFeitaComOutraPelaFrenteEEmProgresso() {
        Situacao s = classificar(List.of(
            sessao("2026-11-01T14:00"), sessao("2026-11-18T13:00"), sessao("2026-11-25T13:00")));
        assertEquals(KanbanColuna.em_progresso, s.coluna());
        assertEquals(2, s.sessaoAtual());
        assertEquals(LocalDateTime.parse("2026-11-18T13:00"), s.proximaSessao());
    }

    @Test
    void sessaoEmAndamentoContaComoAtual() {
        Situacao s = classificar(List.of(sessao("2026-11-10T11:00")));
        assertEquals(KanbanColuna.em_progresso, s.coluna());
        assertEquals(1, s.sessaoAtual());
    }

    @Test
    void todasAsSessoesTerminadasEFinalizado() {
        Situacao s = classificar(List.of(sessao("2026-10-20T14:00"), sessao("2026-10-28T09:00")));
        assertEquals(KanbanColuna.finalizado, s.coluna());
        assertEquals(LocalDate.parse("2026-10-28"), s.concluidoEm());
        assertNull(s.sessaoAtual());
    }

    @Test
    void statusConcluidaFinalizaMesmoComSessaoFutura() {
        List<Sessao> futura = List.of(sessao("2026-11-20T14:00"));
        assertEquals(KanbanColuna.finalizado,
            ClassificadorKanban.doServico(AppointmentStatus.concluida, futura, AGORA).coluna());
    }

    @Test
    void chatSemServicoComMensagemEstaIniciado() {
        assertTrue(ClassificadorKanban.chatIniciado(AGORA.minusHours(2), List.of()));
        assertFalse(ClassificadorKanban.chatIniciado(null, List.of()));
    }

    @Test
    void chatComServicoEmAbertoNaoEstaIniciado() {
        Situacao aberto = classificar(List.of(sessao("2026-11-20T14:00")));
        assertFalse(ClassificadorKanban.chatIniciado(AGORA.minusMinutes(5), List.of(aberto)));
    }

    @Test
    void chatVoltaParaIniciadoSoComMensagemDepoisDoServicoFinalizado() {
        Situacao finalizado = classificar(List.of(sessao("2026-11-01T14:00"))); // termina 16:00
        assertFalse(ClassificadorKanban.chatIniciado(LocalDateTime.parse("2026-10-30T10:00"), List.of(finalizado)));
        assertTrue(ClassificadorKanban.chatIniciado(LocalDateTime.parse("2026-11-05T10:00"), List.of(finalizado)));
    }
}
