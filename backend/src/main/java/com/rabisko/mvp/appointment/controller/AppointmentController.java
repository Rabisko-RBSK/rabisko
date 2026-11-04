package com.rabisko.mvp.appointment.controller;

import com.rabisko.mvp.appointment.domain.AgendaEstudioDTO;
import com.rabisko.mvp.appointment.domain.AgendamentoInvalidoException;
import com.rabisko.mvp.appointment.domain.AppointmentDTO;
import com.rabisko.mvp.appointment.domain.AtualizarStatusSessaoRequest;
import com.rabisko.mvp.appointment.domain.BusySlotDTO;
import com.rabisko.mvp.appointment.domain.CheckInRequest;
import com.rabisko.mvp.appointment.domain.ConflitoAgendaException;
import com.rabisko.mvp.appointment.domain.CreateAppointmentRequest;
import com.rabisko.mvp.appointment.domain.EditarServicoRequest;
import com.rabisko.mvp.appointment.domain.SessaoListItemDTO;
import com.rabisko.mvp.appointment.service.AppointmentService;
import com.rabisko.mvp.appointment.service.TokenCheckinService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    /** POST /appointments — cria agendamento (só tatuadores). */
    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentDTO criar(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @RequestBody @Valid CreateAppointmentRequest request) {
        return appointmentService.criarAgendamento(usuario, request);
    }

    /**
     * PUT /appointments/{id} — o tatuador edita o serviço: valor total e as
     * sessões futuras não marcadas (remarca, adiciona, remove). O cliente
     * recebe a grade atualizada no chat.
     */
    @PutMapping("/appointments/{id}")
    public AppointmentDTO editar(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @PathVariable UUID id,
            @RequestBody @Valid EditarServicoRequest request) {
        return appointmentService.editarServico(usuario, id, request);
    }

    /** GET /appointments/{id} — detalhe de um agendamento (participante do chat). */
    @GetMapping("/appointments/{id}")
    public AppointmentDTO obter(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @PathVariable UUID id) {
        return appointmentService.obterAgendamento(usuario, id);
    }

    /**
     * GET /appointments/busy-slots?date=YYYY-MM-DD
     * Retorna intervalos já ocupados do tatuador logado para o seletor de horário.
     * Resolve o tatuadorId a partir do JWT — o mobile não precisa conhecê-lo.
     */
    @GetMapping("/appointments/busy-slots")
    public List<BusySlotDTO> busySlots(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.obterHorariosOcupados(usuario, date);
    }

    /**
     * GET /appointments/minhas-sessoes?de=YYYY-MM-DD&ate=YYYY-MM-DD
     * Lista as sessões do usuário logado.
     * Cliente: sem params → todas as sessões.
     * Artista: params de + ate obrigatórios (range da semana para o Gantt).
     */
    @GetMapping("/appointments/minhas-sessoes")
    public List<SessaoListItemDTO> minhasSessoes(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return appointmentService.listarSessoes(usuario, de, ate);
    }

    /**
     * GET /appointments/agenda-estudio?date=YYYY-MM-DD
     * Posições do estúdio do tatuador logado e as sessões já reservadas em
     * cada uma no dia (tela de posições ao agendar). Tatuador sem estúdio
     * recebe vinculadoEstudio=false.
     */
    @GetMapping("/appointments/agenda-estudio")
    public AgendaEstudioDTO agendaEstudio(
            @AuthenticationPrincipal UsuarioLogado usuario,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.obterAgendaDoEstudio(usuario, date);
    }

    @PatchMapping("/appointments/sessoes/{sessionId}/status")
    public ResponseEntity<Void> atualizarStatusSessao(
            @AuthenticationPrincipal UsuarioLogado logado,
            @PathVariable UUID sessionId,
            @RequestBody @Valid AtualizarStatusSessaoRequest body
    ) {
        appointmentService.atualizarStatusSessao(logado, sessionId, body.status());
        return ResponseEntity.noContent().build();
    }

    /** 409 com o motivo do conflito no corpo (o handler padrão do Spring esconde a mensagem). */
    @ExceptionHandler(ConflitoAgendaException.class)
    public ResponseEntity<Map<String, String>> conflito(ConflitoAgendaException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("mensagem", e.getMessage()));
    }

    @ExceptionHandler(AgendamentoInvalidoException.class)
    public ResponseEntity<Map<String, String>> agendamentoInvalido(AgendamentoInvalidoException e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
    }

    /**
     * GET /artists/{tatuadorId}/busy-slots?date=YYYY-MM-DD
     * Versão pública (para consulta de disponibilidade pelo cliente, uso futuro).
     */
    @GetMapping("/artists/{tatuadorId}/busy-slots")
    public List<BusySlotDTO> busySlotsPublico(
            @PathVariable UUID tatuadorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.obterHorariosOcupadosPorId(tatuadorId, date);
    }

    @GetMapping("/appointments/sessoes/{sessionId}/qrcode")
    public ResponseEntity<TokenCheckinService.TokenCheckin> qrCodeSessao(
            @AuthenticationPrincipal UsuarioLogado logado,
            @PathVariable UUID sessionId
    ) {
        return ResponseEntity.ok(appointmentService.gerarQrCode(logado, sessionId));
    }

    @PostMapping("/appointments/sessoes/check-in")
    public ResponseEntity<Void> checkIn(
            @AuthenticationPrincipal UsuarioLogado logado,
            @RequestBody @Valid CheckInRequest body
    ) {
        appointmentService.checkIn(logado, body.token());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/appointments/{id}/finalizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> finalizarServico(
            @AuthenticationPrincipal UsuarioLogado logado,
            @PathVariable UUID id,
            @RequestParam(value = "adicionarAoPortfolio", defaultValue = "false") boolean adicionarAoPortfolio,
            @RequestParam(value = "foto", required = false) MultipartFile foto
    ) {
        appointmentService.finalizarServico(logado, id, adicionarAoPortfolio, foto);
        return ResponseEntity.noContent().build();
    }

}
