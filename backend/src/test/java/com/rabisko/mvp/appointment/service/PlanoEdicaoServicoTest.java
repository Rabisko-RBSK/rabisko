package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.AgendamentoInvalidoException;
import com.rabisko.mvp.appointment.domain.SessaoEditada;
import com.rabisko.mvp.appointment.service.PlanoEdicaoServico.SessaoAtual;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PlanoEdicaoServicoTest {

    private static final UUID A = UUID.randomUUID();
    private static final UUID B = UUID.randomUUID();

    private static SessaoAtual atual(UUID id, String inicio) {
        return new SessaoAtual(id, LocalDateTime.parse(inicio), 60, 1);
    }

    private static SessaoEditada pedido(UUID id, String inicio, int duracao, int posicao) {
        LocalDateTime i = LocalDateTime.parse(inicio);
        return new SessaoEditada(id, i.toLocalDate(), i.toLocalTime(), duracao, posicao);
    }

    private static final List<SessaoAtual> EDITAVEIS =
        List.of(atual(A, "2026-12-10T14:00"), atual(B, "2026-12-17T14:00"));

    @Test
    void semMudancaOPlanoFicaVazio() {
        var plano = PlanoEdicaoServico.montar(EDITAVEIS, 0, List.of(
            pedido(A, "2026-12-10T14:00", 60, 1), pedido(B, "2026-12-17T14:00", 60, 1)));
        assertTrue(plano.vazio());
    }

    @Test
    void mudarDataDuracaoOuPosicaoAltera() {
        var plano = PlanoEdicaoServico.montar(EDITAVEIS, 0, List.of(
            pedido(A, "2026-12-11T15:00", 60, 1), pedido(B, "2026-12-17T14:00", 120, 2)));
        assertEquals(List.of(A, B), plano.alterar().stream().map(PlanoEdicaoServico.Alteracao::sessionId).toList());
        assertTrue(plano.criar().isEmpty());
        assertTrue(plano.cancelar().isEmpty());
    }

    @Test
    void semIdCriaEOmitidaCancela() {
        var nova = pedido(null, "2026-12-24T10:00", 60, 1);
        var plano = PlanoEdicaoServico.montar(EDITAVEIS, 0, List.of(pedido(A, "2026-12-10T14:00", 60, 1), nova));
        assertEquals(List.of(nova), plano.criar());
        assertEquals(List.of(B), plano.cancelar());
        assertEquals(List.of(nova), plano.aValidar());
    }

    @Test
    void idQueNaoEhEditavelEhRecusado() {
        assertThrows(AgendamentoInvalidoException.class, () -> PlanoEdicaoServico.montar(EDITAVEIS, 1,
            List.of(pedido(UUID.randomUUID(), "2026-12-10T14:00", 60, 1))));
    }

    @Test
    void mesmaSessaoDuasVezesEhRecusada() {
        assertThrows(AgendamentoInvalidoException.class, () -> PlanoEdicaoServico.montar(EDITAVEIS, 0,
            List.of(pedido(A, "2026-12-10T14:00", 60, 1), pedido(A, "2026-12-11T14:00", 60, 1))));
    }

    @Test
    void servicoNaoPodeFicarSemSessao() {
        assertThrows(AgendamentoInvalidoException.class, () -> PlanoEdicaoServico.montar(EDITAVEIS, 0, List.of()));
    }

    @Test
    void comSessaoTravadaPodeRemoverTodasAsEditaveis() {
        var plano = PlanoEdicaoServico.montar(EDITAVEIS, 1, List.of());
        assertEquals(List.of(A, B), plano.cancelar());
    }
}
