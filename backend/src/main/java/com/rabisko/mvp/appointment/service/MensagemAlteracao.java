package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Texto enviado no chat ao cliente quando o tatuador edita o serviço: a
 * grade de sessões que vale a partir de agora e o valor total.
 */
public final class MensagemAlteracao {

    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private MensagemAlteracao() {}

    /** @param sessoes sessões ativas do serviço (não canceladas), em ordem de data */
    public static String montar(List<IntervaloSessao> sessoes, BigDecimal valorTotal, String tatuador) {
        StringBuilder sb = new StringBuilder("Agendamento atualizado!");

        for (int i = 0; i < sessoes.size(); i++) {
            IntervaloSessao s = sessoes.get(i);
            sb.append('\n');
            if (sessoes.size() > 1) sb.append("\nSessão ").append(i + 1).append('\n');
            sb.append("Dia: ").append(s.inicio().format(DIA)).append('\n');
            sb.append("Horário: ").append(s.inicio().format(HORA));
        }

        sb.append("\n\nValor total: ").append(NumberFormat.getCurrencyInstance(PT_BR).format(valorTotal));
        sb.append("\nTatuador: ").append(tatuador);
        return sb.toString();
    }
}
