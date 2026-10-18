package com.rabisko.mvp.appointment.domain;

/** Pedido de agendamento inconsistente (400), ex.: posição ausente ou inexistente. */
public class AgendamentoInvalidoException extends RuntimeException {
    public AgendamentoInvalidoException(String message) {
        super(message);
    }
}
