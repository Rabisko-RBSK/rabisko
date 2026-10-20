package com.rabisko.mvp.appointment.service;

import com.rabisko.mvp.appointment.domain.*;
import com.rabisko.mvp.appointment.repository.AppointmentRepository;
import com.rabisko.mvp.appointment.repository.AppointmentSessionRepository;
import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.chat.domain.Chat;
import com.rabisko.mvp.chat.repository.ChatRepository;
import com.rabisko.mvp.chat.service.ChatService;
import com.rabisko.mvp.client.domain.Client;
import com.rabisko.mvp.client.repository.ClientRepository;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.user.domain.UserRole;
import com.rabisko.mvp.user.repository.UserRepository;

import java.math.BigDecimal;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    /** Igual ao chk_duracao de `reservas` (duracao_min <= 720). */
    private static final int DURACAO_MAXIMA_MIN = 720;

    /** Faixa usada quando a listagem de sessões vem sem `de`/`ate`. */
    private static final LocalDate SEM_LIMITE_INICIO = LocalDate.of(1970, 1, 1);
    private static final LocalDate SEM_LIMITE_FIM = LocalDate.of(9999, 12, 31);

    @Autowired private StudioRepository studioRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private AppointmentSessionRepository sessionRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatService chatService;

    @Transactional
    public AppointmentDTO criarAgendamento(User logado, CreateAppointmentRequest req) {
        if (logado.getRole() != UserRole.tatuador) {
            throw new AccessDeniedException("Apenas tatuadores podem criar agendamentos");
        }

        Artist artista = artistRepository.findByUserId(logado.getUserId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

        Chat chat = chatRepository.findById(req.chatId())
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));

        if (!chat.getTatuadorId().equals(artista.getTatuadorId())) {
            throw new AccessDeniedException("Você não participa deste chat");
        }

        Client cliente = clientRepository.findById(chat.getClienteId())
            .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        List<IntervaloSessao> novas = validarHorarios(artista, req.sessoes());

        Appointment appointment = appointmentRepository.save(Appointment.builder()
            .chatId(req.chatId())
            .clienteId(cliente.getClientId())
            .tatuadorId(artista.getTatuadorId())
            .status(AppointmentStatus.confirmada)
            .valorTotal(req.valorTotal())
            .build());

        List<AppointmentSession> sessoesSalvas = novas.stream()
            .map(s -> sessionRepository.save(AppointmentSession.builder()
                .appointmentId(appointment.getAppointmentId())
                .tatuadorId(artista.getTatuadorId())
                .clienteId(cliente.getClientId())
                .dataSessao(s.inicio())
                .duracaoMinutos(s.duracaoMinutos())
                .posicao(s.posicao())
                .build()))
            .collect(Collectors.toList());

        chatService.enviarConfirmacaoAgendamento(logado, chat, MensagemConfirmacao.montar(novas, logado.getNome()));

        return toDTO(appointment, sessoesSalvas);
    }

    /**
     * Garante que nenhuma sessão nova se sobrepõe a outra. Tatuador de estúdio:
     * cada sessão precisa de uma posição válida e não pode colidir com reservas
     * da equipe na mesma posição. Todos: não pode colidir com a própria agenda.
     *
     * O lock (estúdio ou tatuador) dura até o commit da transação de
     * criarAgendamento, então duas reservas simultâneas não passam juntas.
     */
    private List<IntervaloSessao> validarHorarios(Artist artista, List<SessionInput> sessoes) {
        Studio estudio = null;
        if (artista.getEstudioId() != null) {
            estudio = studioRepository.lockById(artista.getEstudioId())
                .orElseThrow(() -> new EntityNotFoundException("Estúdio não encontrado"));
        } else {
            artistRepository.lockById(artista.getTatuadorId());
        }

        List<IntervaloSessao> novas = new ArrayList<>();
        for (SessionInput s : sessoes) {
            Integer posicao = null;
            if (estudio != null) {
                if (s.posicao() == null) {
                    throw new AgendamentoInvalidoException("Selecione a posição do estúdio para cada sessão.");
                }
                if (s.posicao() > estudio.getPosicoes()) {
                    throw new AgendamentoInvalidoException(
                        "O estúdio tem apenas " + estudio.getPosicoes() + " posição(ões).");
                }
                posicao = s.posicao();
            }
            novas.add(new IntervaloSessao(
                artista.getTatuadorId(), LocalDateTime.of(s.data(), s.horario()), s.duracaoMinutos(), posicao));
        }

        ValidadorAgenda.primeiroHorarioPassado(novas, LocalDateTime.now())
            .ifPresent(msg -> { throw new AgendamentoInvalidoException(msg); });

        List<UUID> equipe = estudio != null
            ? artistRepository.findByEstudioId(estudio.getEstudioId()).stream().map(Artist::getTatuadorId).toList()
            : List.of(artista.getTatuadorId());

        LocalDateTime de = novas.stream().map(IntervaloSessao::inicio).min(Comparator.naturalOrder()).orElseThrow();
        LocalDateTime ate = novas.stream().map(IntervaloSessao::fim).max(Comparator.naturalOrder()).orElseThrow();
        List<IntervaloSessao> existentes = sessoesAtivas(equipe, de, ate).stream()
            .map(IntervaloSessao::de)
            .toList();

        ValidadorAgenda.primeiroConflito(novas, existentes, artista.getTatuadorId())
            .ifPresent(msg -> { throw new ConflitoAgendaException(msg); });
        return novas;
    }

    /**
     * Sessões não canceladas (nem a sessão nem o agendamento pai) dos
     * tatuadores que podem se sobrepor à janela [de, ate]. Começa a busca
     * DURACAO_MAXIMA_MIN antes para pegar sessões que iniciam antes e ainda
     * estão em andamento.
     */
    private List<AppointmentSession> sessoesAtivas(Collection<UUID> tatuadores, LocalDateTime de, LocalDateTime ate) {
        if (tatuadores.isEmpty()) return List.of();
        List<AppointmentSession> sessoes = sessionRepository.findByTatuadorIdInAndDataSessaoBetween(
            tatuadores, de.minusMinutes(DURACAO_MAXIMA_MIN), ate);

        Set<UUID> agendamentosCancelados = appointmentRepository
            .findAllById(sessoes.stream().map(AppointmentSession::getAppointmentId).collect(Collectors.toSet()))
            .stream()
            .filter(a -> a.getStatus() == AppointmentStatus.cancelada)
            .map(Appointment::getAppointmentId)
            .collect(Collectors.toSet());

        return sessoes.stream()
            .filter(s -> s.getStatus() != AppointmentStatus.cancelada)
            .filter(s -> !agendamentosCancelados.contains(s.getAppointmentId()))
            .filter(s -> s.getDataSessao().plusMinutes(s.getDuracaoMinutos()).isAfter(de))
            .toList();
    }

    /**
     * Ocupação das posições do estúdio do tatuador logado no dia — alimenta a
     * tela de posições (gráfico de Gantt) ao agendar uma sessão.
     */
    public AgendaEstudioDTO obterAgendaDoEstudio(User logado, LocalDate data) {
        if (logado.getRole() != UserRole.tatuador) {
            throw new AccessDeniedException("Apenas tatuadores podem consultar a agenda do estúdio");
        }
        Artist artista = artistRepository.findByUserId(logado.getUserId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
        if (artista.getEstudioId() == null) {
            return AgendaEstudioDTO.semEstudio(data);
        }

        Studio estudio = studioRepository.findById(artista.getEstudioId())
            .orElseThrow(() -> new EntityNotFoundException("Estúdio não encontrado"));
        List<Artist> equipe = artistRepository.findByEstudioId(estudio.getEstudioId());

        Map<UUID, UUID> userPorTatuador = equipe.stream()
            .collect(Collectors.toMap(Artist::getTatuadorId, Artist::getUserId));
        Map<UUID, String> nomePorUser = userRepository.findAllById(userPorTatuador.values()).stream()
            .collect(Collectors.toMap(User::getUserId, User::getNome));

        List<ReservaPosicaoDTO> reservas = sessoesAtivas(
                userPorTatuador.keySet(), data.atStartOfDay(), data.plusDays(1).atStartOfDay()).stream()
            .filter(s -> s.getDataSessao().isBefore(data.plusDays(1).atStartOfDay()))
            .map(s -> new ReservaPosicaoDTO(
                s.getPosicao(),
                s.getDataSessao().toLocalDate(),
                s.getDataSessao().toLocalTime(),
                s.getDuracaoMinutos(),
                nomePorUser.getOrDefault(userPorTatuador.get(s.getTatuadorId()), "Tatuador"),
                s.getTatuadorId().equals(artista.getTatuadorId())))
            .sorted(Comparator.comparing(ReservaPosicaoDTO::data).thenComparing(ReservaPosicaoDTO::horario))
            .toList();

        return new AgendaEstudioDTO(true, estudio.getEstudioId(), estudio.getNome(), estudio.getPosicoes(), data, reservas);
    }

    public AppointmentDTO obterAgendamento(User logado, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new EntityNotFoundException("Agendamento não encontrado"));

        verificarParticipacao(logado, appointment);

        List<AppointmentSession> sessoes = sessionRepository.findByAppointmentId(appointmentId);
        return toDTO(appointment, sessoes);
    }

    /** Versão autenticada — resolve tatuadorId do JWT (uso no modal do artista). */
    public List<BusySlotDTO> obterHorariosOcupados(User logado, LocalDate data) {
        if (logado.getRole() != UserRole.tatuador) {
            throw new AccessDeniedException("Apenas tatuadores podem consultar horários ocupados");
        }
        Artist artista = artistRepository.findByUserId(logado.getUserId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
        return obterHorariosOcupadosPorId(artista.getTatuadorId(), data);
    }

    /** Versão pública — busca por tatuadorId direto (uso futuro para clientes). */
    public List<BusySlotDTO> obterHorariosOcupadosPorId(UUID tatuadorId, LocalDate data) {
        Set<UUID> idsAtivos = appointmentRepository
            .findByTatuadorIdAndStatusNot(tatuadorId, AppointmentStatus.cancelada)
            .stream()
            .map(Appointment::getAppointmentId)
            .collect(Collectors.toSet());

        LocalDateTime inicioDia = data.atStartOfDay();
        LocalDateTime fimDia    = data.atTime(LocalTime.MAX);

        return sessionRepository
            .findByTatuadorIdAndDataSessaoBetween(tatuadorId, inicioDia, fimDia).stream()
            .filter(s -> idsAtivos.contains(s.getAppointmentId()))
            .map(s -> new BusySlotDTO(
                s.getDataSessao().toLocalTime(),
                s.getDuracaoMinutos()
            ))
            .collect(Collectors.toList());
    }

    public List<SessaoListItemDTO> listarSessoes(User logado, LocalDate de, LocalDate ate) {
        if (logado.getRole() == UserRole.cliente) {
            Client cliente = clientRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            List<AppointmentSession> sessoes = sessionRepository.findByClienteId(cliente.getClientId());
            return sessoes.stream()
                .map(s -> {
                    Artist artista = artistRepository.findById(s.getTatuadorId())
                        .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
                    User user = userRepository.findById(artista.getUserId())
                        .orElseThrow(() -> new EntityNotFoundException("Usuário do tatuador não encontrado"));
                    BigDecimal valorTotal = appointmentRepository.findById(s.getAppointmentId())
                        .map(Appointment::getValorTotal)
                        .orElse(BigDecimal.ZERO);
                    return new SessaoListItemDTO(
                        s.getSessionId(),
                        s.getAppointmentId(),
                        s.getDataSessao().toLocalDate(),
                        s.getDataSessao().toLocalTime(),
                        s.getDuracaoMinutos(),
                        user.getNome(),
                        artista.getFotoPerfilUrl(),
                        valorTotal,
                        s.getStatus().name()
                    );
                })
                .sorted(Comparator.comparing(SessaoListItemDTO::data).thenComparing(SessaoListItemDTO::horario))
                .collect(Collectors.toList());

        } else if (logado.getRole() == UserRole.tatuador) {
            Artist artista = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

            // Sem filtro: limites largos, mas representáveis no Postgres. LocalDate.MIN/MAX
            // estouram o timestamptz ao converter do fuso America/Sao_Paulo (erro 500).
            LocalDate inicio = de != null ? de : SEM_LIMITE_INICIO;
            LocalDate fim    = ate != null ? ate : SEM_LIMITE_FIM;
            LocalDateTime inicioDia = inicio.atStartOfDay();
            LocalDateTime fimDia   = fim.atTime(LocalTime.MAX);

            List<AppointmentSession> sessoes = sessionRepository
                .findByTatuadorIdAndDataSessaoBetween(artista.getTatuadorId(), inicioDia, fimDia);
            return sessoes.stream()
                .map(s -> {
                    Client cliente = clientRepository.findById(s.getClienteId())
                        .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
                    User user = userRepository.findById(cliente.getUserId())
                        .orElseThrow(() -> new EntityNotFoundException("Usuário do cliente não encontrado"));
                    BigDecimal valorTotal = appointmentRepository.findById(s.getAppointmentId())
                        .map(Appointment::getValorTotal)
                        .orElse(BigDecimal.ZERO);
                    return new SessaoListItemDTO(
                        s.getSessionId(),
                        s.getAppointmentId(),
                        s.getDataSessao().toLocalDate(),
                        s.getDataSessao().toLocalTime(),
                        s.getDuracaoMinutos(),
                        user.getNome(),
                        null,
                        valorTotal,
                        s.getStatus().name()
                    );
                })
                .sorted(Comparator.comparing(SessaoListItemDTO::data).thenComparing(SessaoListItemDTO::horario))
                .collect(Collectors.toList());

        } else {
            throw new AccessDeniedException("Esse papel não tem acesso a sessões");
        }
    }

    private void verificarParticipacao(User logado, Appointment appointment) {
        if (logado.getRole() == UserRole.tatuador) {
            Artist artista = artistRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
            if (!appointment.getTatuadorId().equals(artista.getTatuadorId())) {
                throw new AccessDeniedException("Você não participa deste agendamento");
            }
        } else if (logado.getRole() == UserRole.cliente) {
            Client cliente = clientRepository.findByUserId(logado.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));
            if (!appointment.getClienteId().equals(cliente.getClientId())) {
                throw new AccessDeniedException("Você não participa deste agendamento");
            }
        } else {
            throw new AccessDeniedException("Esse papel não tem acesso a agendamentos");
        }
    }

    private AppointmentDTO toDTO(Appointment a, List<AppointmentSession> sessoes) {
        List<AppointmentSessionDTO> sessoesDTO = sessoes.stream()
            .map(s -> {
                return new AppointmentSessionDTO(
                    s.getSessionId(),
                    s.getDataSessao().toLocalDate(),
                    s.getDataSessao().toLocalTime(),
                    s.getDuracaoMinutos(),
                    s.getPosicao()
                );
            })
            .collect(Collectors.toList());
        return new AppointmentDTO(
            a.getAppointmentId(), a.getChatId(), a.getClienteId(), a.getTatuadorId(),
            a.getStatus().name(), a.getValorTotal(), sessoesDTO, a.getDataCriacao()
        );
    }
}
