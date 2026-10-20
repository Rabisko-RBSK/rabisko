package com.rabisko.mvp.artist.service;

import com.rabisko.mvp.artist.domain.HorarioDiaDTO;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Regras da semana de horario de funcionamento. Sem dependencias de
 * Spring/banco para ser testavel isoladamente (ver ValidadorHorariosTest).
 *
 * A lista traz so os dias ABERTOS; dia ausente = fechado.
 */
public final class ValidadorHorarios {

    private static final String[] NOMES = {
            "segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"
    };

    /** "Na segunda" ... "No sábado". */
    private static final String[] NOMES_COM_PREPOSICAO = {
            "Na segunda", "Na terça", "Na quarta", "Na quinta", "Na sexta", "No sábado", "No domingo"
    };

    private ValidadorHorarios() {}

    /** @return a mensagem do primeiro problema encontrado, ou vazio se a semana e valida. */
    public static Optional<String> primeiroErro(List<HorarioDiaDTO> horarios) {
        if (horarios == null || horarios.isEmpty()) {
            return Optional.of("Informe ao menos um dia de atendimento.");
        }

        Set<Integer> dias = new HashSet<>();
        for (HorarioDiaDTO h : horarios) {
            if (h == null || h.diaSemana() == null || h.abre() == null || h.fecha() == null) {
                return Optional.of("Horário incompleto: informe o dia, a abertura e o fechamento.");
            }
            int dia = h.diaSemana();
            if (dia < 1 || dia > 7) {
                return Optional.of("Dia da semana inválido: " + dia + ".");
            }
            if (!dias.add(dia)) {
                return Optional.of("O dia " + NOMES[dia - 1] + " foi informado mais de uma vez.");
            }
            if (!h.fecha().isAfter(h.abre())) {
                return Optional.of(NOMES_COM_PREPOSICAO[dia - 1] + ", o fechamento precisa ser depois da abertura.");
            }
        }
        return Optional.empty();
    }
}
