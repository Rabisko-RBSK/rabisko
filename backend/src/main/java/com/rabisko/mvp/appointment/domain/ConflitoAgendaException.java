package com.rabisko.mvp.appointment.domain;

/** Horário pedido sobrepõe outra sessão (409). A mensagem vai para o app. */
public class ConflitoAgendaException extends RuntimeException {
    public ConflitoAgendaException(String message) {
        super(message);
    }
}
