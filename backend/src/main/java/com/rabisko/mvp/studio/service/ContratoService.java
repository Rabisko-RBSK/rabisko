package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.studio.domain.ContratoColaborador;
import com.rabisko.mvp.studio.domain.ContratoDTO;
import com.rabisko.mvp.studio.domain.ContratoInputDTO;
import com.rabisko.mvp.studio.domain.ContratoStatus;
import com.rabisko.mvp.studio.domain.ConviteDetalheDTO;
import com.rabisko.mvp.studio.repository.ContratoColaboradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.rabisko.mvp.studio.domain.ContratoStatus.*;

@Service
public class ContratoService {

    @Autowired
    private ContratoColaboradorRepository contratoRepository;

    @Transactional
    public ContratoColaborador proporNoConvite(UUID estudioId, UUID tatuadorId, UUID conviteId, ContratoInputDTO input) {
        return salvarProposta(input.toEntity(estudioId, tatuadorId, conviteId));
    }

    @Transactional
    public ContratoColaborador proporRenegociacao(UUID estudioId, UUID tatuadorId, ContratoInputDTO input) {
        if (contratoRepository.existsByEstudioIdAndTatuadorIdAndStatus(estudioId, tatuadorId, proposto)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ja existe uma proposta pendente para este colaborador; cancele-a antes de enviar outra");
        }
        return salvarProposta(input.toEntity(estudioId, tatuadorId, null));
    }

    private ContratoColaborador salvarProposta(ContratoColaborador contrato) {
        try {
            return contratoRepository.saveAndFlush(contrato);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe uma proposta pendente para este tatuador");
        }
    }

    @Transactional
    public void aceitarDoConvite(UUID conviteId, UUID tatuadorId, LocalDateTime agora) {
        contratoRepository.findByConviteId(conviteId)
                .filter(c -> c.getStatus() == proposto)
                .ifPresent(c -> responder(c, ativo, agora));

        contratoRepository.cancelarPropostasDeOutrosConvites(tatuadorId, conviteId, agora);
    }

    @Transactional
    public void recusarDoConvite(UUID conviteId, LocalDateTime agora) {
        responderPropostaDoConvite(conviteId, recusado, agora);
    }

    @Transactional
    public void cancelarDoConvite(UUID conviteId, LocalDateTime agora) {
        responderPropostaDoConvite(conviteId, cancelado, agora);
    }

    private void responderPropostaDoConvite(UUID conviteId, ContratoStatus novoStatus, LocalDateTime agora) {
        contratoRepository.findByConviteId(conviteId)
                .filter(c -> c.getStatus() == proposto)
                .ifPresent(c -> responder(c, novoStatus, agora));
    }

    @Transactional
    public ContratoColaborador aceitarRenegociacao(UUID estudioId, UUID tatuadorId) {
        ContratoColaborador proposta = exigirProposta(estudioId, tatuadorId);
        LocalDateTime agora = LocalDateTime.now();

        contratoRepository.findByEstudioIdAndTatuadorIdAndStatus(estudioId, tatuadorId, ativo)
                .ifPresent(atual -> {
                    encerrar(atual, agora);
                    contratoRepository.saveAndFlush(atual);
                });

        responder(proposta, ativo, agora);
        return contratoRepository.saveAndFlush(proposta);
    }

    @Transactional
    public ContratoColaborador recusarRenegociacao(UUID estudioId, UUID tatuadorId) {
        ContratoColaborador proposta = exigirProposta(estudioId, tatuadorId);
        responder(proposta, recusado, LocalDateTime.now());
        return proposta;
    }

    @Transactional
    public ContratoColaborador cancelarRenegociacao(UUID estudioId, UUID tatuadorId) {
        ContratoColaborador proposta = exigirProposta(estudioId, tatuadorId);
        responder(proposta, cancelado, LocalDateTime.now());
        return proposta;
    }

    private ContratoColaborador exigirProposta(UUID estudioId, UUID tatuadorId) {
        return contratoRepository.findByEstudioIdAndTatuadorIdAndStatus(estudioId, tatuadorId, proposto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhuma proposta pendente"));
    }

    @Transactional
    public void encerrarVinculo(UUID estudioId, UUID tatuadorId) {
        LocalDateTime agora = LocalDateTime.now();

        contratoRepository.findByEstudioIdAndTatuadorIdAndStatus(estudioId, tatuadorId, ativo)
                .ifPresent(c -> encerrar(c, agora));

        contratoRepository.findByEstudioIdAndTatuadorIdAndStatus(estudioId, tatuadorId, proposto)
                .ifPresent(c -> responder(c, cancelado, agora));
    }

    public Map<UUID, ContratoDTO> contratosPorConvite(Collection<UUID> conviteIds) {
        if (conviteIds.isEmpty()) return Map.of();
        return contratoRepository.findByConviteIdIn(conviteIds).stream()
                .collect(Collectors.toMap(ContratoColaborador::getConviteId, ContratoDTO::from));
    }

    public List<ConviteDetalheDTO> comContratos(List<ConviteDetalheDTO> convites) {
        Map<UUID, ContratoDTO> contratos = contratosPorConvite(
                convites.stream().map(ConviteDetalheDTO::conviteId).toList());
        return convites.stream()
                .map(c -> c.withContrato(contratos.get(c.conviteId())))
                .toList();
    }

    public record ContratosVigentes(ContratoDTO ativo, ContratoDTO proposto) {}

    public Map<UUID, ContratosVigentes> contratosVigentes(UUID estudioId, Collection<UUID> tatuadorIds) {
        if (tatuadorIds.isEmpty()) return Map.of();

        Map<UUID, ContratoDTO> ativos = new HashMap<>();
        Map<UUID, ContratoDTO> propostos = new HashMap<>();
        for (ContratoColaborador c : contratoRepository.findByEstudioIdAndTatuadorIdInAndStatusIn(
                estudioId, tatuadorIds, List.of(ativo, proposto))) {
            (c.getStatus() == ativo ? ativos : propostos).put(c.getTatuadorId(), ContratoDTO.from(c));
        }

        return tatuadorIds.stream().distinct().collect(Collectors.toMap(
                Function.identity(),
                id -> new ContratosVigentes(ativos.get(id), propostos.get(id))));
    }

    public List<ContratoDTO> historico(UUID estudioId, UUID tatuadorId) {
        return contratoRepository.findByEstudioIdAndTatuadorIdOrderByDataCriacaoDesc(estudioId, tatuadorId)
                .stream().map(ContratoDTO::from).toList();
    }

    public List<ContratoDTO> historicoDoTatuador(UUID tatuadorId) {
        return contratoRepository.findByTatuadorIdOrderByDataCriacaoDesc(tatuadorId)
                .stream().map(ContratoDTO::from).toList();
    }

    private void responder(ContratoColaborador c, ContratoStatus novoStatus, LocalDateTime agora) {
        c.setStatus(novoStatus);
        c.setDataResposta(agora);
    }

    private void encerrar(ContratoColaborador c, LocalDateTime agora) {
        c.setStatus(encerrado);
        c.setDataEncerramento(agora);
    }
}
