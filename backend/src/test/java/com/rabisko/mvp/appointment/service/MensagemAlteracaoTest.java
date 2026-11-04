package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MensagemAlteracaoTest {

    private static final UUID EU = UUID.randomUUID();

    private static IntervaloSessao sessao(String inicio) {
        return new IntervaloSessao(EU, LocalDateTime.parse(inicio), 60, 1);
    }

    @Test
    void listaAGradeEOValor() {
        String msg = MensagemAlteracao.montar(
            List.of(sessao("2026-12-10T14:00"), sessao("2026-12-17T09:30")), new BigDecimal("1500"), "Ana");
        assertEquals("""
            Agendamento atualizado!

            Sessão 1
            Dia: 10/12/2026
            Horário: 14:00

            Sessão 2
            Dia: 17/12/2026
            Horário: 09:30

            Valor total: R$ 1.500,00
            Tatuador: Ana""", msg);
    }

    @Test
    void umaSessaoSemNumeracao() {
        String msg = MensagemAlteracao.montar(List.of(sessao("2026-12-10T14:00")), new BigDecimal("300.5"), "Ana");
        assertTrue(msg.startsWith("Agendamento atualizado!\nDia: 10/12/2026\nHorário: 14:00\n\nValor total: R$"));
        assertTrue(msg.endsWith("300,50\nTatuador: Ana"));
    }
}
