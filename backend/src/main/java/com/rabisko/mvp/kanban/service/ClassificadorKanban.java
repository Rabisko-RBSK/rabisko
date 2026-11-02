package com.rabisko.mvp.kanban.service;

import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.kanban.domain.KanbanColuna;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Em que coluna do Kanban cada serviço aparece. Sem dependências
 * de Spring/banco para ser testável isoladamente (ver ClassificadorKanbanTest).
 *
 * O status do serviço fica "confirmada" desde a criação — nada o avança —, então
 * a coluna sai das datas das sessões não canceladas:
 *   - finalizado: status concluida, ou todas as sessões já terminaram (a flag
 *     `finalizado` de servicos é ignorada: nada no app a grava, e no seed ela
 *     aparece em serviço com sessão futura);
 *   - agendado: nenhuma sessão começou ainda;
 *   - em_progresso: alguma sessão já começou e ainda há sessão por terminar.
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
     * @param sessaoAtual   posição (1..total) da próxima sessão, ou da que está em andamento.
     * @param fim           fim da última sessão (null sem sessões).
     */
    public record Situacao(
        KanbanColuna coluna,
        int totalSessoes,
        Integer sessaoAtual,
        LocalDateTime proximaSessao,
        LocalDateTime fim
    ) {
        public LocalDate concluidoEm() {
            return coluna == KanbanColuna.finalizado && fim != null ? fim.toLocalDate() : null;
        }
    }

    public static Situacao doServico(
            AppointmentStatus status, List<Sessao> sessoes, LocalDateTime agora) {

        List<Sessao> ordenadas = sessoes.stream().sorted(Comparator.comparing(Sessao::inicio)).toList();
        int total = ordenadas.size();
        LocalDateTime fim = ordenadas.stream().map(Sessao::fim).max(Comparator.naturalOrder()).orElse(null);

        boolean todasTerminaram = fim != null && !fim.isAfter(agora);
        if (status == AppointmentStatus.concluida || todasTerminaram) {
            return new Situacao(KanbanColuna.finalizado, total, null, null, fim);
        }

        if (total == 0) {
            return new Situacao(KanbanColuna.agendado, 0, null, null, null);
        }

        boolean comecou = !ordenadas.get(0).inicio().isAfter(agora);
        KanbanColuna coluna = comecou || status == AppointmentStatus.em_andamento
            ? KanbanColuna.em_progresso
            : KanbanColuna.agendado;

        // Próxima = a primeira que ainda não terminou (pode estar em andamento).
        for (int i = 0; i < total; i++) {
            Sessao s = ordenadas.get(i);
            if (s.fim().isAfter(agora)) {
                return new Situacao(coluna, total, i + 1, s.inicio(), fim);
            }
        }
        throw new IllegalStateException("Sessão em aberto não encontrada");
    }
}
