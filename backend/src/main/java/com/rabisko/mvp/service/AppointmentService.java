package com.rabisko.mvp.service;

import com.rabisko.mvp.domain.appointment.*;
import com.rabisko.mvp.domain.artist.Artist;
import com.rabisko.mvp.domain.chat.Chat;
import com.rabisko.mvp.domain.client.Client;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.domain.user.UserRole;
import com.rabisko.mvp.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private AppointmentSessionRepository sessionRepository;
    @Autowired private ChatRepository chatRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private ClientRepository clientRepository;

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

        Appointment appointment = appointmentRepository.save(Appointment.builder()
            .chatId(req.chatId())
            .clienteId(cliente.getClientId())
            .tatuadorId(artista.getTatuadorId())
            .status(AppointmentStatus.confirmada)
            .valorTotal(req.valorTotal())
            .build());

        List<AppointmentSession> sessoesSalvas = req.sessoes().stream()
            .map(s -> sessionRepository.save(AppointmentSession.builder()
                .appointmentId(appointment.getAppointmentId())
                .tatuadorId(artista.getTatuadorId())
                .clienteId(cliente.getClientId())
                .dataSessao(LocalDateTime.of(s.data(), s.horario()))
                .duracaoMinutos(s.duracaoMinutos())
                .build()))
            .collect(Collectors.toList());

        return toDTO(appointment, sessoesSalvas);
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

        // JDBC já converte TIMESTAMPTZ → LocalDateTime aplicando o fuso do JVM (BRT)
        // na leitura, então os valores retornados já estão em horário local.
        // O range da query usa LocalDateTime sem ajuste — o JDBC converte os parâmetros
        // da mesma forma, mantendo a consistência.
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
                // JDBC já converte TIMESTAMPTZ → LocalDateTime em BRT na leitura;
                // não aplicar conversão manual aqui.
                return new AppointmentSessionDTO(
                    s.getSessionId(),
                    s.getDataSessao().toLocalDate(),
                    s.getDataSessao().toLocalTime(),
                    s.getDuracaoMinutos()
                );
            })
            .collect(Collectors.toList());
        return new AppointmentDTO(
            a.getAppointmentId(), a.getChatId(), a.getClienteId(), a.getTatuadorId(),
            a.getStatus().name(), a.getValorTotal(), sessoesDTO, a.getDataCriacao()
        );
    }
}
