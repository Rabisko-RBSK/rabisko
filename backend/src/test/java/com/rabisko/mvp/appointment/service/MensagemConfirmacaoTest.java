package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MensagemConfirmacaoTest {

    private static final UUID EU = UUID.randomUUID();

    private static IntervaloSessao sessao(String inicio) {
        return new IntervaloSessao(EU, LocalDateTime.parse(inicio), 60, null);
    }

    @Test
    void umaSessao() {
        String msg = MensagemConfirmacao.montar(List.of(sessao("2026-11-10T14:00")), "Ana");
        assertEquals("""
            Sessão Agendada com sucesso!
            Dia: 10/11/2026
            Horário: 14:00
            Tatuador: Ana""", msg);
    }

    @Test
    void variasSessoesListamCadaUma() {
        String msg = MensagemConfirmacao.montar(
            List.of(sessao("2026-11-10T14:00"), sessao("2026-11-17T09:30")), "Ana");
        assertEquals("""
            Sessões Agendadas com sucesso!

            Sessão 1
            Dia: 10/11/2026
            Horário: 14:00

            Sessão 2
            Dia: 17/11/2026
            Horário: 09:30

            Tatuador: Ana""", msg);
    }
}
