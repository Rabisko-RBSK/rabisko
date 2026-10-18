package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ValidadorAgendaTest {

    private static final UUID EU = UUID.randomUUID();
    private static final UUID COLEGA = UUID.randomUUID();

    private static IntervaloSessao sessao(UUID tatuador, String hora, int minutos, Integer posicao) {
        return new IntervaloSessao(tatuador, LocalDateTime.parse("2026-11-10T" + hora), minutos, posicao);
    }

    private static Optional<String> validar(List<IntervaloSessao> novas, List<IntervaloSessao> existentes) {
        return ValidadorAgenda.primeiroConflito(novas, existentes, EU);
    }

    @Test
    void semReservasNaoHaConflito() {
        assertTrue(validar(List.of(sessao(EU, "14:00", 60, 1)), List.of()).isEmpty());
    }

    @Test
    void mesmaPosicaoSobrepostaDeOutroTatuadorConflita() {
        Optional<String> conflito = validar(
                List.of(sessao(EU, "15:00", 60, 1)),
                List.of(sessao(COLEGA, "14:00", 120, 1)));
        assertEquals("A posição 1 já está reservada em 10/11 das 14:00 às 16:00.", conflito.orElseThrow());
    }

    @Test
    void outraPosicaoNoMesmoHorarioDeOutroTatuadorEhPermitida() {
        assertTrue(validar(
                List.of(sessao(EU, "15:00", 60, 2)),
                List.of(sessao(COLEGA, "14:00", 120, 1))).isEmpty());
    }

    @Test
    void propriaSessaoEmOutraPosicaoConflita() {
        Optional<String> conflito = validar(
                List.of(sessao(EU, "15:00", 60, 2)),
                List.of(sessao(EU, "14:00", 120, 1)));
        assertTrue(conflito.orElseThrow().startsWith("Você já tem uma sessão"));
    }

    @Test
    void sessaoQueApenasEncostaNoFimNaoConflita() {
        assertTrue(validar(
                List.of(sessao(EU, "16:00", 60, 1)),
                List.of(sessao(COLEGA, "14:00", 120, 1))).isEmpty());
        assertTrue(validar(
                List.of(sessao(EU, "13:00", 60, 1)),
                List.of(sessao(COLEGA, "14:00", 120, 1))).isEmpty());
    }

    @Test
    void sessoesDaMesmaPropostaNaoPodemSeSobrepor() {
        Optional<String> conflito = validar(
                List.of(sessao(EU, "19:00", 60, 1), sessao(EU, "19:30", 60, 2)), List.of());
        assertEquals("As sessões desta proposta se sobrepõem entre si.", conflito.orElseThrow());
    }

    @Test
    void sessaoSemPosicaoDeColegaNaoBloqueiaPosicao() {
        // Sessões antigas (sem posição) de outro tatuador não ocupam nenhuma posição.
        assertTrue(validar(
                List.of(sessao(EU, "14:00", 60, 1)),
                List.of(sessao(COLEGA, "14:00", 60, null))).isEmpty());
    }

    @Test
    void tatuadorSemEstudioSoConflitaComAPropriaAgenda() {
        assertTrue(validar(
                List.of(sessao(EU, "10:00", 60, null)),
                List.of(sessao(COLEGA, "10:00", 60, null))).isEmpty());
        assertTrue(validar(
                List.of(sessao(EU, "10:30", 60, null)),
                List.of(sessao(EU, "10:00", 60, null))).isPresent());
    }

    @Test
    void sessaoQueComecaNoDiaAnteriorEAindaEstaEmAndamentoConflita() {
        IntervaloSessao madrugada = new IntervaloSessao(COLEGA, LocalDateTime.parse("2026-11-09T23:00"), 180, 1);
        assertTrue(validar(List.of(sessao(EU, "01:00", 60, 1)), List.of(madrugada)).isPresent());
    }
}
