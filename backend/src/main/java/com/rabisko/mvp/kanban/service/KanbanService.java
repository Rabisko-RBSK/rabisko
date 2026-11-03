package com.rabisko.mvp.kanban.service;

import com.rabisko.mvp.appointment.domain.Appointment;
import com.rabisko.mvp.appointment.domain.AppointmentSession;
import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.appointment.domain.SessaoListItemDTO;
import com.rabisko.mvp.appointment.repository.AppointmentRepository;
import com.rabisko.mvp.appointment.repository.AppointmentSessionRepository;
import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.chat.domain.Chat;
import com.rabisko.mvp.chat.domain.NaoLidasDoChat;
import com.rabisko.mvp.chat.repository.ChatRepository;
import com.rabisko.mvp.chat.repository.MessageRepository;
import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.kanban.domain.KanbanCardDTO;
import com.rabisko.mvp.kanban.domain.KanbanColuna;
import com.rabisko.mvp.kanban.service.ClassificadorKanban.Sessao;
import com.rabisko.mvp.kanban.service.ClassificadorKanban.Situacao;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.studio.domain.ContratoColaborador;
import com.rabisko.mvp.studio.domain.ContratoStatus;
import com.rabisko.mvp.studio.repository.ContratoColaboradorRepository;
import com.rabisko.mvp.studio.service.StudioService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Kanban de serviços (somente leitura). O tatuador vê os próprios serviços e
 * os chats com mensagens que ele não leu; o estúdio vê os serviços com sessão
 * nele e os chats em que alguém da equipe (contrato ativo, inclusive o dono)
 * não leu o cliente — ou seja, cliente sem resposta, e há quanto tempo.
 */
@Service
public class KanbanService {

    private static final List<AppointmentStatus> FORA_DO_KANBAN =
        List.of(AppointmentStatus.cancelada, AppointmentStatus.no_show);

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private AppointmentSessionRepository sessionRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ContratoColaboradorRepository contratoRepository;
    @Autowired private StudioService studioService;

    @Transactional(readOnly = true)
    public List<KanbanCardDTO> doTatuador(UsuarioLogado logado) {
        if (!"tatuador".equals(logado.papel())) {
            throw new AccessDeniedException("Apenas tatuadores têm Kanban de serviços próprio");
        }
        Artist artista = artistRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

        return montar(
            appointmentRepository.findByTatuadorIdAndStatusNotIn(artista.getTatuadorId(), FORA_DO_KANBAN),
            Set.of(artista.getTatuadorId()));
    }

    @Transactional(readOnly = true)
    public List<KanbanCardDTO> doEstudio(UsuarioLogado logado) {
        UUID estudioId = studioService.exigirEstudioDoUser(logado).getEstudioId();
        Set<UUID> equipe = contratoRepository.findByEstudioIdAndStatus(estudioId, ContratoStatus.ativo).stream()
            .map(ContratoColaborador::getTatuadorId)
            .collect(Collectors.toSet());

        return montar(appointmentRepository.servicosDoEstudio(estudioId, FORA_DO_KANBAN), equipe);
    }

    /** @param tatuadores de quem entram os chats com mensagens não lidas. */
    private List<KanbanCardDTO> montar(List<Appointment> servicos, Set<UUID> tatuadores) {
        Map<UUID, List<AppointmentSession>> sessoes = sessoesAtivas(servicos);
        Map<UUID, Situacao> situacoes = situacoes(servicos, sessoes, LocalDateTime.now());

        List<NaoLidasDoChat> naoLidas = tatuadores.isEmpty() ? List.of()
            : messageRepository.naoLidasPeloTatuador(tatuadores);
        Map<UUID, Chat> chats = chatRepository
            .findAllById(naoLidas.stream().map(NaoLidasDoChat::chatId).toList()).stream()
            .collect(Collectors.toMap(Chat::getChatId, Function.identity()));

        Map<UUID, Client> clientes = clientRepository.findAllById(Stream.concat(
                servicos.stream().map(Appointment::getClienteId),
                chats.values().stream().map(Chat::getClienteId)).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Client::getClientId, Function.identity()));
        Map<UUID, String> nomesTatuadores = artistRepository.findAllById(Stream.concat(
                servicos.stream().map(Appointment::getTatuadorId),
                chats.values().stream().map(Chat::getTatuadorId)).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Artist::getTatuadorId, Artist::getNome));

        Stream<KanbanCardDTO> cardsDeChat = naoLidas.stream()
            .map(n -> {
                Chat c = chats.get(n.chatId());
                Client cliente = clientes.get(c.getClienteId());
                return new KanbanCardDTO(
                    KanbanColuna.mensagens_nao_lidas, c.getChatId(), null,
                    nomeDo(cliente), cliente == null ? null : cliente.getAuthId(),
                    c.getTatuadorId(), nomesTatuadores.getOrDefault(c.getTatuadorId(), "Tatuador"),
                    0, null, null, null,
                    (int) n.naoLidas(), comFuso(n.primeiraNaoLida()), comFuso(n.ultimaNaoLida()), null);
            });

        Stream<KanbanCardDTO> cardsDeServico = servicos.stream()
            .map(a -> {
                Situacao s = situacoes.get(a.getAppointmentId());
                Client cliente = clientes.get(a.getClienteId());
                AppointmentSession referencia = sessaoDeReferencia(
                    s, sessoes.getOrDefault(a.getAppointmentId(), List.of()));
                return new KanbanCardDTO(
                    s.coluna(), a.getChatId(), a.getAppointmentId(),
                    nomeDo(cliente), cliente == null ? null : cliente.getAuthId(),
                    a.getTatuadorId(), nomesTatuadores.getOrDefault(a.getTatuadorId(), "Tatuador"),
                    s.totalSessoes(), s.sessaoAtual(), s.proximaSessao(), s.concluidoEm(),
                    null, null, null,
                    referencia == null ? null : paraDetalhe(referencia, a, nomeDo(cliente)));
            });

        return Stream.concat(cardsDeChat, cardsDeServico).sorted(ORDEM).toList();
    }

    /** Sessões não canceladas de cada serviço, por appointmentId. */
    private Map<UUID, List<AppointmentSession>> sessoesAtivas(Collection<Appointment> servicos) {
        if (servicos.isEmpty()) return Map.of();
        return sessionRepository
            .findByAppointmentIdIn(servicos.stream().map(Appointment::getAppointmentId).toList()).stream()
            .filter(s -> s.getStatus() != AppointmentStatus.cancelada)
            .collect(Collectors.groupingBy(AppointmentSession::getAppointmentId));
    }

    private static Map<UUID, Situacao> situacoes(
            Collection<Appointment> servicos, Map<UUID, List<AppointmentSession>> sessoes, LocalDateTime agora) {
        return servicos.stream().collect(Collectors.toMap(
            Appointment::getAppointmentId,
            a -> ClassificadorKanban.doServico(a.getStatus(),
                sessoes.getOrDefault(a.getAppointmentId(), List.of()).stream()
                    .map(s -> new Sessao(s.getDataSessao(), s.getDuracaoMinutos()))
                    .toList(),
                agora)));
    }

    /** A próxima (ou em andamento) em agendado/em_progresso; a última em finalizado. */
    private static AppointmentSession sessaoDeReferencia(Situacao s, List<AppointmentSession> sessoes) {
        if (s.proximaSessao() != null) {
            return sessoes.stream()
                .filter(x -> x.getDataSessao().equals(s.proximaSessao()))
                .findFirst().orElse(null);
        }
        return sessoes.stream().max(Comparator.comparing(AppointmentSession::getDataSessao)).orElse(null);
    }

    /** Mesmo formato de /appointments/minhas-sessoes, que o modal de detalhes do Gantt recebe. */
    private static SessaoListItemDTO paraDetalhe(AppointmentSession s, Appointment a, String clienteNome) {
        return new SessaoListItemDTO(
            s.getSessionId(), a.getAppointmentId(),
            s.getDataSessao().toLocalDate(), s.getDataSessao().toLocalTime(), s.getDuracaoMinutos(),
            clienteNome, null, a.getValorTotal(), s.getStatus().name());
    }

    private static String nomeDo(Client cliente) {
        return cliente == null ? "Cliente" : cliente.getNome();
    }

    /** `data_envio` vem no fuso da aplicação; o app calcula "há quanto tempo", então vai com offset. */
    private static OffsetDateTime comFuso(LocalDateTime quando) {
        return quando.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    /**
     * Por coluna; dentro dela, o mais relevante primeiro: cliente esperando há
     * mais tempo, sessão mais próxima, conclusão mais recente.
     */
    private static final Comparator<KanbanCardDTO> ORDEM = Comparator
        .comparing(KanbanCardDTO::coluna)
        .thenComparing(KanbanCardDTO::aguardandoDesde, Comparator.nullsLast(Comparator.naturalOrder()))
        .thenComparing(KanbanCardDTO::proximaSessao, Comparator.nullsLast(Comparator.naturalOrder()))
        .thenComparing(KanbanCardDTO::concluidoEm, Comparator.nullsLast(Comparator.reverseOrder()));
}
