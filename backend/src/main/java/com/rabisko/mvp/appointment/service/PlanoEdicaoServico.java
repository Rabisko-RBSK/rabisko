package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.AgendamentoInvalidoException;
import com.rabisko.mvp.appointment.domain.SessaoEditada;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Compara as sessões editáveis do serviço com o pedido de edição e decide o
 * que muda: alterar (data, duração ou posição diferente), criar (sem id) e
 * cancelar (editável que não veio no pedido). As demais ficam como estão.
 */
public final class PlanoEdicaoServico {

    /** Sessão editável como está gravada. */
    public record SessaoAtual(UUID sessionId, LocalDateTime inicio, int duracaoMinutos, Integer posicao) {}

    public record Alteracao(UUID sessionId, SessaoEditada nova) {}

    public record Plano(List<Alteracao> alterar, List<SessaoEditada> criar, List<UUID> cancelar) {
        public boolean vazio() {
            return alterar.isEmpty() && criar.isEmpty() && cancelar.isEmpty();
        }

        /** Sessões a validar na agenda, na ordem: alteradas, depois criadas. */
        public List<SessaoEditada> aValidar() {
            List<SessaoEditada> todas = new ArrayList<>(alterar.stream().map(Alteracao::nova).toList());
            todas.addAll(criar);
            return todas;
        }
    }

    private PlanoEdicaoServico() {}

    /**
     * @param travadas quantas sessões do serviço já aconteceram ou foram
     *                 marcadas (não mudam, mas contam para o serviço não ficar vazio)
     */
    public static Plano montar(List<SessaoAtual> editaveis, int travadas, List<SessaoEditada> pedido) {
        Map<UUID, SessaoAtual> porId = editaveis.stream()
            .collect(Collectors.toMap(SessaoAtual::sessionId, Function.identity()));

        if (travadas + pedido.size() == 0) {
            throw new AgendamentoInvalidoException(
                "O serviço precisa de ao menos uma sessão. Para encerrá-lo, finalize o serviço.");
        }

        List<Alteracao> alterar = new ArrayList<>();
        List<SessaoEditada> criar = new ArrayList<>();
        Set<UUID> mantidas = new HashSet<>();

        for (SessaoEditada s : pedido) {
            if (s.sessionId() == null) {
                criar.add(s);
                continue;
            }
            SessaoAtual atual = porId.get(s.sessionId());
            if (atual == null || !mantidas.add(s.sessionId())) {
                throw new AgendamentoInvalidoException(
                    "Só sessões futuras e ainda não marcadas podem ser alteradas.");
            }
            boolean mudou = !atual.inicio().equals(LocalDateTime.of(s.data(), s.horario()))
                || atual.duracaoMinutos() != s.duracaoMinutos()
                || !Objects.equals(atual.posicao(), s.posicao());
            if (mudou) alterar.add(new Alteracao(s.sessionId(), s));
        }

        List<UUID> cancelar = editaveis.stream()
            .map(SessaoAtual::sessionId)
            .filter(id -> !mantidas.contains(id))
            .toList();

        return new Plano(alterar, criar, cancelar);
    }
}
