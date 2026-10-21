package com.rabisko.mvp.appointment.domain;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Uma sessão vista como intervalo [inicio, fim) — usada na validação de
 * conflitos. Intervalos que só se encostam (fim de um = início do outro)
 * não se sobrepõem.
 *
 * @param posicao posição do estúdio ocupada; null quando não ocupa posição
 */
public record IntervaloSessao(UUID tatuadorId, LocalDateTime inicio, int duracaoMinutos, Integer posicao) {

    public LocalDateTime fim() {
        return inicio.plusMinutes(duracaoMinutos);
    }

    public boolean sobrepoe(IntervaloSessao outro) {
        return inicio.isBefore(outro.fim()) && outro.inicio.isBefore(fim());
    }

    public static IntervaloSessao de(AppointmentSession s) {
        return new IntervaloSessao(s.getTatuadorId(), s.getDataSessao(), s.getDuracaoMinutos(), s.getPosicao());
    }
}
