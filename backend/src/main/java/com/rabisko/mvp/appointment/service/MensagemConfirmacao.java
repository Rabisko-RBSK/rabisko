package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Texto enviado no chat ao cliente quando o tatuador agenda pelo chat.
 * Com mais de uma sessão, lista o dia e o horário de cada uma.
 */
public final class MensagemConfirmacao {

    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private MensagemConfirmacao() {}

    public static String montar(List<IntervaloSessao> sessoes, String tatuador) {
        StringBuilder sb = new StringBuilder(
            sessoes.size() > 1 ? "Sessões Agendadas com sucesso!" : "Sessão Agendada com sucesso!");

        for (int i = 0; i < sessoes.size(); i++) {
            IntervaloSessao s = sessoes.get(i);
            sb.append('\n');
            if (sessoes.size() > 1) sb.append("\nSessão ").append(i + 1).append('\n');
            sb.append("Dia: ").append(s.inicio().format(DIA)).append('\n');
            sb.append("Horário: ").append(s.inicio().format(HORA));
        }

        sb.append(sessoes.size() > 1 ? "\n\n" : "\n").append("Tatuador: ").append(tatuador);
        return sb.toString();
    }
}
