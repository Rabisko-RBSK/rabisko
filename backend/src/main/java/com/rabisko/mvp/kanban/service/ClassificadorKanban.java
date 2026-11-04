package com.rabisko.mvp.kanban.service;

import com.rabisko.mvp.kanban.domain.KanbanColuna;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Em que coluna do Kanban cada serviço aparece. Sem dependências
 * de Spring/banco para ser testável isoladamente (ver ClassificadorKanbanTest).
 *
 * Quem encerra o serviço é o tatuador (POST /appointments/{id}/finalizar, que
 * grava a flag `finalizado`); as datas das sessões não canceladas decidem o resto:
 *   - finalizado: só com a flag `finalizado`;
 *   - agendado: nenhuma sessão começou ainda (ou o serviço não tem sessão);
 *   - em_progresso: alguma sessão já começou. Inclui o serviço em que todas as
 *     sessões já passaram e ninguém finalizou — "aguardando finalização", com
 *     sessaoAtual e proximaSessao nulos.
 * A coluna mensagens_nao_lidas vem dos chats, não dos serviços (KanbanService).
 */
public final class ClassificadorKanban {

    private ClassificadorKanban() {}

    public record Sessao(LocalDateTime inicio, int duracaoMinutos) {
        LocalDateTime fim() {
            return inicio.plusMinutes(duracaoMinutos);
        }
    }

    /**
     * @param sessaoAtual   posição (1..total) da próxima sessão, ou da que está em
     *                      andamento; null em finalizado e em "aguardando finalização".
     * @param concluidoEm   dia da finalização (ou do fim da última sessão, quando
     *                      não há data gravada); só em finalizado.
     */
    public record Situacao(
        KanbanColuna coluna,
        int totalSessoes,
        Integer sessaoAtual,
        LocalDateTime proximaSessao,
        LocalDate concluidoEm
    ) {
        /** Todas as sessões já passaram, mas o tatuador ainda não finalizou. */
        public boolean aguardandoFinalizacao() {
            return coluna == KanbanColuna.em_progresso && sessaoAtual == null;
        }
    }

    public static Situacao doServico(
            boolean finalizado, LocalDateTime dataFinalizacao, List<Sessao> sessoes, LocalDateTime agora) {

        List<Sessao> ordenadas = sessoes.stream().sorted(Comparator.comparing(Sessao::inicio)).toList();
        int total = ordenadas.size();

        if (finalizado) {
            LocalDate concluidoEm = dataFinalizacao != null
                ? dataFinalizacao.toLocalDate()
                : ordenadas.stream().map(Sessao::fim).max(Comparator.naturalOrder())
                    .map(LocalDateTime::toLocalDate).orElse(null);
            return new Situacao(KanbanColuna.finalizado, total, null, null, concluidoEm);
        }

        if (total == 0) {
            return new Situacao(KanbanColuna.agendado, 0, null, null, null);
        }

        boolean comecou = !ordenadas.get(0).inicio().isAfter(agora);
        KanbanColuna coluna = comecou ? KanbanColuna.em_progresso : KanbanColuna.agendado;

        // Próxima = a primeira que ainda não terminou (pode estar em andamento).
        for (int i = 0; i < total; i++) {
            Sessao s = ordenadas.get(i);
            if (s.fim().isAfter(agora)) {
                return new Situacao(coluna, total, i + 1, s.inicio(), null);
            }
        }
        // Todas já passaram e ninguém finalizou: aguardando finalização.
        return new Situacao(KanbanColuna.em_progresso, total, null, null, null);
    }
}
