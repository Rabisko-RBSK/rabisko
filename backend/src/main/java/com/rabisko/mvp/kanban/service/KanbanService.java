package com.rabisko.mvp.kanban.service;

import com.rabisko.mvp.appointment.domain.Appointment;
import com.rabisko.mvp.appointment.domain.AppointmentSession;
import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.appointment.repository.AppointmentRepository;
import com.rabisko.mvp.appointment.repository.AppointmentSessionRepository;
import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.chat.domain.Chat;
import com.rabisko.mvp.chat.repository.ChatRepository;
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
 * chats; o estúdio vê os serviços com sessão nele e os chats de quem tem
 * contrato ativo no estúdio (inclusive o dono).
 */
@Service
public class KanbanService {

    private static final List<AppointmentStatus> FORA_DO_KANBAN =
        List.of(AppointmentStatus.cancelada, AppointmentStatus.no_show);

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private AppointmentSessionRepository sessionRepository;
    @Autowired private ChatRepository chatRepository;
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
            chatRepository.findByTatuadorId(artista.getTatuadorId()));
    }

    @Transactional(readOnly = true)
    public List<KanbanCardDTO> doEstudio(UsuarioLogado logado) {
        UUID estudioId = studioService.exigirEstudioDoUser(logado).getEstudioId();
        Set<UUID> equipe = contratoRepository.findByEstudioIdAndStatus(estudioId, ContratoStatus.ativo).stream()
            .map(ContratoColaborador::getTatuadorId)
            .collect(Collectors.toSet());

        return montar(
            appointmentRepository.servicosDoEstudio(estudioId, FORA_DO_KANBAN),
            equipe.isEmpty() ? List.of() : chatRepository.findByTatuadorIdIn(equipe));
    }

    private List<KanbanCardDTO> montar(List<Appointment> servicos, List<Chat> chats) {
        LocalDateTime agora = LocalDateTime.now();

        // Um chat sai de chat_iniciado se tem serviço em aberto — inclusive
        // serviço em outro estúdio, que não aparece como card aqui.
        Set<UUID> chatIds = chats.stream().map(Chat::getChatId).collect(Collectors.toSet());
        List<Appointment> servicosDosChats = chatIds.isEmpty() ? List.of()
            : appointmentRepository.findByChatIdIn(chatIds).stream()
                .filter(a -> !FORA_DO_KANBAN.contains(a.getStatus()))
                .toList();

        Map<UUID, Appointment> todos = Stream.concat(servicos.stream(), servicosDosChats.stream())
            .collect(Collectors.toMap(Appointment::getAppointmentId, Function.identity(), (a, b) -> a));
        Map<UUID, Situacao> situacoes = situacoes(todos.values(), agora);

        Map<UUID, List<Situacao>> situacoesPorChat = servicosDosChats.stream()
            .collect(Collectors.groupingBy(Appointment::getChatId,
                Collectors.mapping(a -> situacoes.get(a.getAppointmentId()), Collectors.toList())));

        List<Chat> chatsIniciados = chats.stream()
            .filter(c -> ClassificadorKanban.chatIniciado(
                horarioLocal(c), situacoesPorChat.getOrDefault(c.getChatId(), List.of())))
            .toList();

        Map<UUID, String> clientes = clientRepository.findAllById(Stream.concat(
                servicos.stream().map(Appointment::getClienteId),
                chatsIniciados.stream().map(Chat::getClienteId)).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Client::getClientId, Client::getNome));
        Map<UUID, String> tatuadores = artistRepository.findAllById(Stream.concat(
                servicos.stream().map(Appointment::getTatuadorId),
                chatsIniciados.stream().map(Chat::getTatuadorId)).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Artist::getTatuadorId, Artist::getNome));

        Stream<KanbanCardDTO> cardsDeChat = chatsIniciados.stream()
            .map(c -> new KanbanCardDTO(
                KanbanColuna.chat_iniciado, c.getChatId(), null,
                clientes.getOrDefault(c.getClienteId(), "Cliente"),
                c.getTatuadorId(), tatuadores.getOrDefault(c.getTatuadorId(), "Tatuador"),
                0, null, null, null, c.getUltimaMensagemEm()));

        Stream<KanbanCardDTO> cardsDeServico = servicos.stream()
            .map(a -> {
                Situacao s = situacoes.get(a.getAppointmentId());
                return new KanbanCardDTO(
                    s.coluna(), a.getChatId(), a.getAppointmentId(),
                    clientes.getOrDefault(a.getClienteId(), "Cliente"),
                    a.getTatuadorId(), tatuadores.getOrDefault(a.getTatuadorId(), "Tatuador"),
                    s.totalSessoes(), s.sessaoAtual(), s.proximaSessao(), s.concluidoEm(), null);
            });

        return Stream.concat(cardsDeChat, cardsDeServico).sorted(ORDEM).toList();
    }

    private Map<UUID, Situacao> situacoes(Collection<Appointment> servicos, LocalDateTime agora) {
        if (servicos.isEmpty()) return Map.of();

        Map<UUID, List<Sessao>> sessoes = sessionRepository
            .findByAppointmentIdIn(servicos.stream().map(Appointment::getAppointmentId).toList()).stream()
            .filter(s -> s.getStatus() != AppointmentStatus.cancelada)
            .collect(Collectors.groupingBy(AppointmentSession::getAppointmentId,
                Collectors.mapping(s -> new Sessao(s.getDataSessao(), s.getDuracaoMinutos()), Collectors.toList())));

        return servicos.stream().collect(Collectors.toMap(
            Appointment::getAppointmentId,
            a -> ClassificadorKanban.doServico(
                a.getStatus(), sessoes.getOrDefault(a.getAppointmentId(), List.of()), agora)));
    }

    /** `ultima_mensagem_em` é timestamptz; as sessões estão no fuso da aplicação. */
    private static LocalDateTime horarioLocal(Chat chat) {
        return chat.getUltimaMensagemEm() == null ? null
            : chat.getUltimaMensagemEm().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    /**
     * Por coluna; dentro dela, o mais relevante primeiro: conversa mais recente,
     * sessão mais próxima, conclusão mais recente.
     */
    private static final Comparator<KanbanCardDTO> ORDEM = Comparator
        .comparing(KanbanCardDTO::coluna)
        .thenComparing(KanbanCardDTO::ultimaMensagemEm, Comparator.nullsLast(Comparator.reverseOrder()))
        .thenComparing(KanbanCardDTO::proximaSessao, Comparator.nullsLast(Comparator.naturalOrder()))
        .thenComparing(KanbanCardDTO::concluidoEm, Comparator.nullsLast(Comparator.reverseOrder()));
}
