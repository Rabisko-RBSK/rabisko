package com.rabisko.mvp.studio.domain.dashboard;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * Intervalo [inicio, fim] (inclusivo, datas de Brasilia) recebido pelas rotas
 * do dashboard. A validacao fica aqui para todas as rotas responderem igual.
 */
public record PeriodoDashboard(LocalDate inicio, LocalDate fim) {

    public static PeriodoDashboard of(String startDate, String endDate) {
        LocalDate inicio = parse("startDate", startDate);
        LocalDate fim = parse("endDate", endDate);
        System.out.println("Passou");
        if (inicio.isAfter(fim)) {
            throw new PeriodoInvalidoException("startDate (" + startDate + ") nao pode ser posterior a endDate (" + endDate + ").");
        }
        return new PeriodoDashboard(inicio, fim);
    }

    private static LocalDate parse(String nome, String valor) {
        if (valor == null || valor.isBlank()) {
            throw new PeriodoInvalidoException("Parametro obrigatorio ausente: " + nome + " (formato YYYY-MM-DD).");
        }
        try {
            return LocalDate.parse(valor);
        } catch (DateTimeParseException e) {
            throw new PeriodoInvalidoException("Data invalida em " + nome + ": '" + valor + "'. Use o formato YYYY-MM-DD.");
        }
    }

    public static class PeriodoInvalidoException extends RuntimeException {
        public PeriodoInvalidoException(String message) {
            super(message);
        }
    }
}
