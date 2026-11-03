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
import com.rabisko.mvp.estilo.repository.EstiloRepository;
import com.rabisko.mvp.horario.service.HorarioService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.studio.service.ContratoService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AppointmentService {

    /** Igual ao chk_duracao de `reservas` (duracao_min <= 720). */
    private static final int DURACAO_MAXIMA_MIN = 720;

    private static final DateTimeFormatter FORMATO_SESSAO = DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm");


    /** Faixa usada quando a listagem de sessões vem sem `de`/`ate`. */
    private static final LocalDate SEM_LIMITE_INICIO = LocalDate.of(1970, 1, 1);
    private static final LocalDate SEM_LIMITE_FIM = LocalDate.of(9999, 12, 31);

    @Autowired private StudioRepository studioRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private AppointmentSessionRepository sessionRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EstiloRepository estiloRepository;
    @Autowired private HorarioService horarioService;
    @Autowired private ContratoService contratoService;
    @Autowired private ChatService chatService;

    /** Sessão já gravada junto com o tatuador do serviço (a sessão não guarda mais o tatuador). */
    private record SessaoDoTatuador(AppointmentSession sessao, Appointment servico) {
        UUID tatuadorId() {
            return servico.getTatuadorId();
        }

        IntervaloSessao intervalo() {
            return new IntervaloSessao(
                servico.getTatuadorId(), sessao.getDataSessao(), sessao.getDuracaoMinutos(), sessao.getPosicao());
        }
    }

    @Transactional
    public AppointmentDTO criarAgendamento(UsuarioLogado logado, CreateAppointmentRequest req) {
        if (!"tatuador".equals(logado.papel())) {
            throw new AccessDeniedException("Apenas tatuadores podem criar agendamentos");
        }

        Artist artista = artistRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

        Chat chat = chatRepository.findById(req.chatId())
            .orElseThrow(() -> new EntityNotFoundException("Chat não encontrado"));

        if (!chat.getTatuadorId().equals(artista.getTatuadorId())) {
            throw new AccessDeniedException("Você não participa deste chat");
        }

        Client cliente = clientRepository.findById(chat.getClienteId())
            .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        if (!estiloRepository.existsById(req.estiloId())) {
            throw new AgendamentoInvalidoException("Estilo não encontrado.");
        }

        // Só atende quem está num estúdio (colaborador ou dono).
        UUID estudioId = contratoService.estudioDeAtendimento(artista.getTatuadorId())
            .orElseThrow(() -> new AgendamentoInvalidoException(
                "Você precisa estar vinculado a um estúdio para agendar sessões."));

        List<IntervaloSessao> novas = validarHorarios(artista, estudioId, req.sessoes());

        Appointment appointment = appointmentRepository.save(Appointment.builder()
            .chatId(req.chatId())
            .clienteId(cliente.getClientId())
            .tatuadorId(artista.getTatuadorId())
            .estiloId(req.estiloId())
            .status(AppointmentStatus.confirmada)
            .valorTotal(req.valorTotal())
            .build());

        List<AppointmentSession> sessoesSalvas = novas.stream()
            .map(s -> sessionRepository.save(AppointmentSession.builder()
                .appointmentId(appointment.getAppointmentId())
                .estudioId(estudioId)
                .dataSessao(s.inicio())
                .duracaoMinutos(s.duracaoMinutos())
                .posicao(s.posicao())
                .build()))
            .collect(Collectors.toList());

        chatService.enviarConfirmacaoAgendamento(logado, chat, MensagemConfirmacao.montar(novas, artista.getNome()));

        return toDTO(appointment, sessoesSalvas);
    }

    /**
     * Garante que nenhuma sessão nova se sobrepõe a outra: cada sessão precisa
     * de uma posição válida do estúdio e não pode colidir com reservas do
     * estúdio na mesma posição, nem com a agenda do próprio tatuador (em
     * qualquer estúdio).
     *
     * Os locks (estúdio e tatuador) duram até o commit da transação de
     * criarAgendamento, então duas reservas simultâneas não passam juntas.
     */
    private List<IntervaloSessao> validarHorarios(Artist artista, UUID estudioId, List<SessionInput> sessoes) {
        Studio estudio = studioRepository.lockById(estudioId)
            .orElseThrow(() -> new EntityNotFoundException("Estúdio não encontrado"));
        artistRepository.lockById(artista.getTatuadorId());

        List<IntervaloSessao> novas = new ArrayList<>();
        for (SessionInput s : sessoes) {
            // Estúdio de uma posição só (ex.: estúdio solo): não precisa escolher.
            Integer posicao = s.posicao() != null || estudio.getPosicoes() > 1 ? s.posicao() : Integer.valueOf(1);
            if (posicao == null) {
                throw new AgendamentoInvalidoException("Selecione a posição do estúdio para cada sessão.");
            }
            if (posicao > estudio.getPosicoes()) {
                throw new AgendamentoInvalidoException(
                    "O estúdio tem apenas " + estudio.getPosicoes() + " posição(ões).");
            }
            novas.add(new IntervaloSessao(
                artista.getTatuadorId(), LocalDateTime.of(s.data(), s.horario()), s.duracaoMinutos(), posicao));
        }

        ValidadorAgenda.primeiroHorarioPassado(novas, LocalDateTime.now())
            .ifPresent(msg -> { throw new AgendamentoInvalidoException(msg); });

        for (IntervaloSessao s : novas) {
            if (!horarioService.atende(estudioId, s.inicio(), s.duracaoMinutos())) {
                throw new AgendamentoInvalidoException(
                    "A sessão de " + s.inicio().format(FORMATO_SESSAO) + " está fora do horário de atendimento do estúdio.");
            }
        }

        LocalDateTime de = novas.stream().map(IntervaloSessao::inicio).min(Comparator.naturalOrder()).orElseThrow();
        LocalDateTime ate = novas.stream().map(IntervaloSessao::fim).max(Comparator.naturalOrder()).orElseThrow();
        LocalDateTime busca = de.minusMinutes(DURACAO_MAXIMA_MIN);

        // Sessões do estúdio (conflito de posição) + do tatuador em qualquer estúdio
        // (ele não pode estar em dois lugares). A mesma sessão pode vir nas duas.
        List<AppointmentSession> candidatas = Stream.concat(
                sessionRepository.findByEstudioIdAndDataSessaoBetween(estudioId, busca, ate).stream(),
                sessionRepository.sessoesDoTatuadorNoPeriodo(artista.getTatuadorId(), busca, ate).stream())
            .collect(Collectors.toMap(AppointmentSession::getSessionId, Function.identity(), (a, b) -> a, LinkedHashMap::new))
            .values().stream()
            .toList();

        List<IntervaloSessao> existentes = sessoesAtivas(candidatas, de).stream()
            .map(SessaoDoTatuador::intervalo)
            .toList();

        ValidadorAgenda.primeiroConflito(novas, existentes, artista.getTatuadorId())
            .ifPresent(msg -> { throw new ConflitoAgendaException(msg); });
        return novas;
    }

    /**
     * Das sessões dadas, as não canceladas (nem a sessão nem o agendamento pai)
     * que terminam depois de `de`, cada uma com o serviço (de onde vêm tatuador
     * e cliente). Quem busca deve começar DURACAO_MAXIMA_MIN antes de `de` para
     * pegar sessões que iniciam antes e ainda estão em andamento.
     */
    private List<SessaoDoTatuador> sessoesAtivas(Collection<AppointmentSession> sessoes, LocalDateTime de) {
        if (sessoes.isEmpty()) return List.of();

        Map<UUID, Appointment> servicos = appointmentRepository
            .findAllById(sessoes.stream().map(AppointmentSession::getAppointmentId).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Appointment::getAppointmentId, Function.identity()));

        return sessoes.stream()
            .filter(s -> s.getStatus() != AppointmentStatus.cancelada)
            .filter(s -> s.getDataSessao().plusMinutes(s.getDuracaoMinutos()).isAfter(de))
            .map(s -> new SessaoDoTatuador(s, servicos.get(s.getAppointmentId())))
            .filter(s -> s.servico() != null && s.servico().getStatus() != AppointmentStatus.cancelada)
            .toList();
    }

    /**
     * Ocupação das posições do estúdio de atendimento do tatuador logado no
     * dia — alimenta a tela de posições (gráfico de Gantt) ao agendar uma sessão.
     */
    public AgendaEstudioDTO obterAgendaDoEstudio(UsuarioLogado logado, LocalDate data) {
        if (!"tatuador".equals(logado.papel())) {
            throw new AccessDeniedException("Apenas tatuadores podem consultar a agenda do estúdio");
        }
        Artist artista = artistRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

        UUID estudioId = contratoService.estudioDeAtendimento(artista.getTatuadorId()).orElse(null);
        if (estudioId == null) {
            return AgendaEstudioDTO.semEstudio(data);
        }

        Studio estudio = studioRepository.findById(estudioId)
            .orElseThrow(() -> new EntityNotFoundException("Estúdio não encontrado"));

        LocalDateTime inicioDia = data.atStartOfDay();
        LocalDateTime fimDia = data.plusDays(1).atStartOfDay();
        List<SessaoDoTatuador> sessoes = sessoesAtivas(
                sessionRepository.findByEstudioIdAndDataSessaoBetween(
                    estudioId, inicioDia.minusMinutes(DURACAO_MAXIMA_MIN), fimDia),
                inicioDia).stream()
            .filter(s -> s.sessao().getDataSessao().isBefore(fimDia))
            .toList();

        // Inclui ex-colaboradores com sessão já marcada no estúdio.
        Map<UUID, String> nomePorTatuador = artistRepository
            .findAllById(sessoes.stream().map(SessaoDoTatuador::tatuadorId).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Artist::getTatuadorId, Artist::getNome));

        List<ReservaPosicaoDTO> reservas = sessoes.stream()
            .map(s -> new ReservaPosicaoDTO(
                s.sessao().getPosicao(),
                s.sessao().getDataSessao().toLocalDate(),
                s.sessao().getDataSessao().toLocalTime(),
                s.sessao().getDuracaoMinutos(),
                nomePorTatuador.getOrDefault(s.tatuadorId(), "Tatuador"),
                s.tatuadorId().equals(artista.getTatuadorId())))
            .sorted(Comparator.comparing(ReservaPosicaoDTO::data).thenComparing(ReservaPosicaoDTO::horario))
            .toList();

        return new AgendaEstudioDTO(true, estudio.getEstudioId(), estudio.getNome(), estudio.getPosicoes(), data, reservas);
    }

    public AppointmentDTO obterAgendamento(UsuarioLogado logado, UUID appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new EntityNotFoundException("Agendamento não encontrado"));

        verificarParticipacao(logado, appointment);

        List<AppointmentSession> sessoes = sessionRepository.findByAppointmentId(appointmentId);
        return toDTO(appointment, sessoes);
    }

    /** Versão autenticada — resolve tatuadorId do JWT (uso no modal do artista). */
    public List<BusySlotDTO> obterHorariosOcupados(UsuarioLogado logado, LocalDate data) {
        if (!"tatuador".equals(logado.papel())) {
            throw new AccessDeniedException("Apenas tatuadores podem consultar horários ocupados");
        }
        Artist artista = artistRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
        return obterHorariosOcupadosPorId(artista.getTatuadorId(), data);
    }

    /** Versão pública — busca por tatuadorId direto (uso futuro para clientes). */
    public List<BusySlotDTO> obterHorariosOcupadosPorId(UUID tatuadorId, LocalDate data) {
        LocalDateTime inicioDia = data.atStartOfDay();
        LocalDateTime fimDia    = data.atTime(LocalTime.MAX);

        return sessoesAtivas(sessionRepository.sessoesDoTatuadorNoPeriodo(tatuadorId, inicioDia, fimDia), inicioDia)
            .stream()
            .map(s -> new BusySlotDTO(
                s.sessao().getDataSessao().toLocalTime(),
                s.sessao().getDuracaoMinutos()
            ))
            .collect(Collectors.toList());
    }

    public List<SessaoListItemDTO> listarSessoes(UsuarioLogado logado, LocalDate de, LocalDate ate) {
        if ("cliente".equals(logado.papel())) {
            Client cliente = clientRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil cliente não encontrado"));

            List<AppointmentSession> sessoes = sessionRepository.sessoesDoCliente(cliente.getClientId());
            Map<UUID, Appointment> servicos = servicosDas(sessoes);
            return sessoes.stream()
                .map(s -> {
                    Appointment servico = servicos.get(s.getAppointmentId());
                    Artist artista = artistRepository.findById(servico.getTatuadorId())
                        .orElseThrow(() -> new EntityNotFoundException("Tatuador não encontrado"));
                    return new SessaoListItemDTO(
                        s.getSessionId(),
                        s.getAppointmentId(),
                        s.getDataSessao().toLocalDate(),
                        s.getDataSessao().toLocalTime(),
                        s.getDuracaoMinutos(),
                        artista.getNome(),
                        artista.getFotoPerfilUrl(),
                        servico.getValorTotal(),
                        s.getStatus().name()
                    );
                })
                .sorted(Comparator.comparing(SessaoListItemDTO::data).thenComparing(SessaoListItemDTO::horario))
                .collect(Collectors.toList());

        } else if ("tatuador".equals(logado.papel())) {
            Artist artista = artistRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));

            // Sem filtro: limites largos, mas representáveis no Postgres. LocalDate.MIN/MAX
            // estouram o timestamptz ao converter do fuso America/Sao_Paulo (erro 500).
            LocalDate inicio = de != null ? de : SEM_LIMITE_INICIO;
            LocalDate fim    = ate != null ? ate : SEM_LIMITE_FIM;
            LocalDateTime inicioDia = inicio.atStartOfDay();
            LocalDateTime fimDia   = fim.atTime(LocalTime.MAX);

            List<AppointmentSession> sessoes = sessionRepository
                .sessoesDoTatuadorNoPeriodo(artista.getTatuadorId(), inicioDia, fimDia);
            Map<UUID, Appointment> servicos = servicosDas(sessoes);
            return sessoes.stream()
                .map(s -> {
                    Appointment servico = servicos.get(s.getAppointmentId());
                    Client cliente = clientRepository.findById(servico.getClienteId())
                        .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));
                    return new SessaoListItemDTO(
                        s.getSessionId(),
                        s.getAppointmentId(),
                        s.getDataSessao().toLocalDate(),
                        s.getDataSessao().toLocalTime(),
                        s.getDuracaoMinutos(),
                        cliente.getNome(),
                        null,
                        servico.getValorTotal(),
                        s.getStatus().name()
                    );
                })
                .sorted(Comparator.comparing(SessaoListItemDTO::data).thenComparing(SessaoListItemDTO::horario))
                .collect(Collectors.toList());

        } else {
            throw new AccessDeniedException("Esse papel não tem acesso a sessões");
        }
    }

    /** Serviço (agendamento pai) de cada sessão, por appointmentId. */
    private Map<UUID, Appointment> servicosDas(Collection<AppointmentSession> sessoes) {
        return appointmentRepository
            .findAllById(sessoes.stream().map(AppointmentSession::getAppointmentId).collect(Collectors.toSet()))
            .stream()
            .collect(Collectors.toMap(Appointment::getAppointmentId, Function.identity()));
    }

    private void verificarParticipacao(UsuarioLogado logado, Appointment appointment) {
        if ("tatuador".equals(logado.papel())) {
            Artist artista = artistRepository.findByAuthId(logado.authId())
                .orElseThrow(() -> new EntityNotFoundException("Perfil tatuador não encontrado"));
            if (!appointment.getTatuadorId().equals(artista.getTatuadorId())) {
                throw new AccessDeniedException("Você não participa deste agendamento");
            }
        } else if ("cliente".equals(logado.papel())) {
            Client cliente = clientRepository.findByAuthId(logado.authId())
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

    @Transactional
    public void atualizarStatusSessao(UsuarioLogado logado, UUID sessionId, AppointmentStatus status) {
        if (status != AppointmentStatus.concluida && status != AppointmentStatus.no_show) {
            throw new AgendamentoInvalidoException("Marque a sessão como realizada ou como falta do cliente.");
        }
        if (!"tatuador".equals(logado.papel())) {
            throw new AccessDeniedException("Apenas o tatuador marca a sessão");
        }
        Artist artista = artistRepository.findByAuthId(logado.authId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil tatuador não encontrado"));
        AppointmentSession sessao = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessão não encontrada"));
        Appointment servico = appointmentRepository.findById(sessao.getAppointmentId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));

        if (!servico.getTatuadorId().equals(artista.getTatuadorId())) {
            throw new AccessDeniedException("Você não participa desta sessão");
        }
        if (sessao.getStatus() == AppointmentStatus.cancelada) {
            throw new ConflitoAgendaException("Sessão cancelada não pode ser marcada.");
        }
        if (sessao.getDataSessao().isAfter(LocalDateTime.now())) {
            throw new AgendamentoInvalidoException("A sessão ainda não aconteceu.");
        }

        sessao.setStatus(status);
    }
}
