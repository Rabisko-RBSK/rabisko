package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.IntervaloSessao;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Regras de sobreposição de sessões. Sem dependências de Spring/banco para
 * ser testável isoladamente (ver ValidadorAgendaTest).
 *
 * Uma sessão nova conflita quando sobrepõe, no tempo:
 *   1. outra sessão nova da mesma proposta (o tatuador não pode estar em dois lugares);
 *   2. uma sessão existente na MESMA posição do estúdio (de qualquer tatuador);
 *   3. uma sessão existente do próprio tatuador, em qualquer posição.
 */
public final class ValidadorAgenda {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DIA = DateTimeFormatter.ofPattern("dd/MM");

    private ValidadorAgenda() {}

    /** @return a mensagem do primeiro conflito encontrado, ou vazio se não há conflito. */
    public static Optional<String> primeiroConflito(
            List<IntervaloSessao> novas, List<IntervaloSessao> existentes, UUID tatuadorId) {

        for (int i = 0; i < novas.size(); i++) {
            for (int j = i + 1; j < novas.size(); j++) {
                if (novas.get(i).sobrepoe(novas.get(j))) {
                    return Optional.of("As sessões desta proposta se sobrepõem entre si.");
                }
            }
        }

        for (IntervaloSessao nova : novas) {
            for (IntervaloSessao existente : existentes) {
                if (!nova.sobrepoe(existente)) continue;

                if (nova.posicao() != null && Objects.equals(nova.posicao(), existente.posicao())) {
                    return Optional.of("A posição " + nova.posicao() + " já está reservada " + periodo(existente) + ".");
                }
                if (Objects.equals(existente.tatuadorId(), tatuadorId)) {
                    return Optional.of("Você já tem uma sessão " + periodo(existente) + ".");
                }
            }
        }
        return Optional.empty();
    }

    private static String periodo(IntervaloSessao s) {
        return "em " + s.inicio().format(DIA) + " das " + s.inicio().format(HORA) + " às " + s.fim().format(HORA);
    }
}
