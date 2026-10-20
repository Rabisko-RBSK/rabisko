package com.rabisko.mvp.artist.service;

import com.rabisko.mvp.artist.domain.HorarioDiaDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ValidadorHorariosTest {

    private static HorarioDiaDTO dia(int diaSemana, String abre, String fecha) {
        return new HorarioDiaDTO(diaSemana, LocalTime.parse(abre), LocalTime.parse(fecha));
    }

    @Test
    void semanaValidaNaoTemErro() {
        assertTrue(ValidadorHorarios.primeiroErro(List.of(
                dia(1, "10:00", "22:00"),
                dia(6, "10:00", "21:00"))).isEmpty());
    }

    @Test
    void semanaVaziaOuNulaEhRecusada() {
        assertEquals("Informe ao menos um dia de atendimento.", ValidadorHorarios.primeiroErro(List.of()).orElseThrow());
        assertEquals("Informe ao menos um dia de atendimento.", ValidadorHorarios.primeiroErro(null).orElseThrow());
    }

    @Test
    void diaRepetidoEhRecusado() {
        assertEquals("O dia terça foi informado mais de uma vez.", ValidadorHorarios.primeiroErro(List.of(
                dia(2, "10:00", "18:00"),
                dia(2, "12:00", "20:00"))).orElseThrow());
    }

    @Test
    void fechamentoAntesOuIgualAAberturaEhRecusado() {
        assertEquals("No sábado, o fechamento precisa ser depois da abertura.",
                ValidadorHorarios.primeiroErro(List.of(dia(6, "18:00", "02:00"))).orElseThrow());
        assertTrue(ValidadorHorarios.primeiroErro(List.of(dia(1, "10:00", "10:00"))).isPresent());
    }

    @Test
    void diaForaDoIntervaloEhRecusado() {
        assertEquals("Dia da semana inválido: 0.",
                ValidadorHorarios.primeiroErro(List.of(dia(0, "10:00", "18:00"))).orElseThrow());
    }

    @Test
    void campoNuloEhRecusado() {
        assertTrue(ValidadorHorarios.primeiroErro(List.of(new HorarioDiaDTO(1, null, LocalTime.NOON))).isPresent());
    }
}
