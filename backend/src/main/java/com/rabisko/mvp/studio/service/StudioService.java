package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistStudioSearchResultDTO;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.endereco.domain.Endereco;
import com.rabisko.mvp.endereco.domain.EnderecoOwnerType;
import com.rabisko.mvp.endereco.service.EnderecoService;
import com.rabisko.mvp.studio.domain.*;
import com.rabisko.mvp.studio.repository.ConviteEstudioRepository;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;


@Service
public class StudioService {

    @Autowired
    private StudioRepository studioRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private ConviteEstudioRepository conviteEstudioRepository;

    @Autowired
    private ContratoService contratoService;

    @Autowired 
    private EnderecoService enderecoService;

    public Studio cadastrarEstudio(User user, RegisterEstudioDTO body) {
        Studio novoStudio = Studio.builder()
                .userId(user.getUserId())
                .nome(user.getNome())
                .email(user.getEmail())
                .cnpj(body.getCnpj())
                .telefone(body.getTelefone())
                .build();

        Studio s = studioRepository.save(novoStudio);

        if(body.getEndereco() != null){
            Endereco e = enderecoService.salvar(s.getEstudioId(), EnderecoOwnerType.estudio, body.getEndereco(), null);
            s.setEnderecoId(e.getEnderecoId());
        }

        return s;
    }

    @Transactional
    public ConviteDTO convidarTatuador(User logado, UUID tatuadorId, ContratoInputDTO contrato) {
        Studio estudio = exigirEstudioDoUser(logado);

        Artist tatuador = artistRepository.findById(tatuadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tatuador nao encontrado"));

        if (tatuador.getEstudioId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tatuador ja esta vinculado a um estudio");
        }

        if (conviteEstudioRepository.existsByEstudioIdAndTatuadorIdAndStatus(
                estudio.getEstudioId(), tatuadorId, ConviteStatus.pendente)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um convite pendente para este tatuador");
        }

        ConviteEstudio convite = ConviteEstudio.builder()
                .estudioId(estudio.getEstudioId())
                .tatuadorId(tatuadorId)
                .build();

        try {
            convite = conviteEstudioRepository.saveAndFlush(convite);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um convite pendente para este tatuador");
        }

        contratoService.proporNoConvite(estudio.getEstudioId(), tatuadorId, convite.getConviteId(), contrato);
        return ConviteDTO.from(convite);
    }

    @Transactional
    public ConviteDTO cancelarConvite(User logado, UUID conviteId) {
        Studio estudio = exigirEstudioDoUser(logado);

        ConviteEstudio convite = conviteEstudioRepository.findById(conviteId)
                .filter(c -> Objects.equals(c.getEstudioId(), estudio.getEstudioId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Convite nao encontrado"));

        if (convite.getStatus() != ConviteStatus.pendente) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Apenas convites pendentes podem ser cancelados");
        }

        LocalDateTime agora = LocalDateTime.now();
        convite.setStatus(ConviteStatus.cancelado);
        convite.setDataResposta(agora);
        contratoService.cancelarDoConvite(conviteId, agora);
        return ConviteDTO.from(convite);
    }

    public List<ConviteDetalheDTO> listarConvitesPendentes(User logado) {
        Studio estudio = exigirEstudioDoUser(logado);
        return contratoService.comContratos(
                conviteEstudioRepository.listarDetalhesDoEstudio(estudio.getEstudioId(), ConviteStatus.pendente));
    }

    public List<ColaboradorDTO> listarColaboradores(User logado) {
        Studio estudio = exigirEstudioDoUser(logado);
        List<ColaboradorDTO> colaboradores = artistRepository.listarColaboradores(estudio.getEstudioId());

        Map<UUID, ContratoService.ContratosVigentes> contratos = contratoService.contratosVigentes(
                estudio.getEstudioId(), colaboradores.stream().map(ColaboradorDTO::tatuadorId).toList());

        return colaboradores.stream()
                .map(c -> {
                    ContratoService.ContratosVigentes v = contratos.get(c.tatuadorId());
                    return c.withContratos(v.ativo(), v.proposto());
                })
                .toList();
    }

    @Transactional
    public void removerColaborador(User logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);

        Artist tatuador = artistRepository.findById(tatuadorId)
                .filter(a -> Objects.equals(a.getEstudioId(), estudio.getEstudioId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador nao encontrado"));

        tatuador.setEstudioId(null);
        tatuador.setVinculadoEstudio(false);
        contratoService.encerrarVinculo(estudio.getEstudioId(), tatuadorId);
    }

    public ContratoDTO proporContrato(User logado, UUID tatuadorId, ContratoInputDTO contrato) {
        Studio estudio = exigirEstudioDoUser(logado);
        exigirColaborador(estudio, tatuadorId);
        return ContratoDTO.from(contratoService.proporRenegociacao(estudio.getEstudioId(), tatuadorId, contrato));
    }

    public ContratoDTO cancelarPropostaContrato(User logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);
        exigirColaborador(estudio, tatuadorId);
        return ContratoDTO.from(contratoService.cancelarRenegociacao(estudio.getEstudioId(), tatuadorId));
    }

    public List<ContratoDTO> historicoContratos(User logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);
        return contratoService.historico(estudio.getEstudioId(), tatuadorId);
    }

    // Garante que a proposta e de renegociacao: quem nao e da equipe so recebe contrato via convite
    private Artist exigirColaborador(Studio estudio, UUID tatuadorId) {
        return artistRepository.findById(tatuadorId)
                .filter(a -> Objects.equals(a.getEstudioId(), estudio.getEstudioId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador nao encontrado"));
    }

    private Studio exigirEstudioDoUser(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sem usuario autenticado");
        }
        return studioRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario nao possui perfil de estudio"
                ));
    }

    public List<ArtistStudioSearchResultDTO> buscarTatuadores(User logado, String termo) {
        exigirEstudioDoUser(logado);
        String t = termo == null ? "" : termo.trim().replaceFirst("^@", "");
        if (t.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos 2 caracteres");
        }
        return artistRepository.buscarParaConvite(t).stream()
                .map(ArtistStudioSearchResultDTO::fromProjection)
                .toList();
    }
}
