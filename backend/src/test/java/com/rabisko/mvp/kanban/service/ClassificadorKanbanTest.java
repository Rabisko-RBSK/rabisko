package com.rabisko.mvp.kanban.service;

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
        return ClassificadorKanban.doServico(false, null, sessoes, AGORA);
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
    void todasAsSessoesTerminadasSemFinalizarAguardaFinalizacao() {
        Situacao s = classificar(List.of(sessao("2026-10-20T14:00"), sessao("2026-10-28T09:00")));
        assertEquals(KanbanColuna.em_progresso, s.coluna());
        assertTrue(s.aguardandoFinalizacao());
        assertNull(s.sessaoAtual());
        assertNull(s.proximaSessao());
    }

    @Test
    void finalizadoPeloTatuadorMesmoComSessaoFutura() {
        Situacao s = ClassificadorKanban.doServico(true, LocalDateTime.parse("2026-11-09T18:00"),
            List.of(sessao("2026-11-20T14:00")), AGORA);
        assertEquals(KanbanColuna.finalizado, s.coluna());
        assertEquals(LocalDate.parse("2026-11-09"), s.concluidoEm());
    }

    @Test
    void finalizadoSemDataUsaFimDaUltimaSessao() {
        Situacao s = ClassificadorKanban.doServico(true, null,
            List.of(sessao("2026-10-20T14:00"), sessao("2026-10-28T09:00")), AGORA);
        assertEquals(LocalDate.parse("2026-10-28"), s.concluidoEm());
    }
}
