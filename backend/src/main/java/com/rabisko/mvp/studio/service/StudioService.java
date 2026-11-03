package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.appointment.domain.AppointmentStatus;
import com.rabisko.mvp.appointment.repository.AppointmentSessionRepository;
import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistStudioSearchResultDTO;
import com.rabisko.mvp.artist.domain.EstudioSoloDTO;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.endereco.domain.Endereco;
import com.rabisko.mvp.endereco.service.EnderecoService;
import com.rabisko.mvp.horario.domain.HorarioDTO;
import com.rabisko.mvp.horario.service.HorarioService;
import com.rabisko.mvp.studio.domain.*;
import com.rabisko.mvp.studio.repository.ConviteEstudioRepository;
import com.rabisko.mvp.studio.repository.StudioRepository;
import com.rabisko.mvp.shared.infraestrutura.cnpj.ResultadoCnpj;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
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
    private AppointmentSessionRepository sessionRepository;

    @Autowired 
    private EnderecoService enderecoService;

    @Autowired 
    private HorarioService horarioService;

    @Transactional
    public Studio cadastrarEstudio(UUID authId, RegisterEstudioDTO body, ResultadoCnpj cnpj) {
        Studio novoStudio = Studio.builder()
                .authId(authId)
                .nome(body.getNome())
                .cnpj(body.getCnpj())
                .telefone(body.getTelefone())
                .posicoes(body.getPosicoes() != null ? body.getPosicoes() : 1)
                .termosAceitos(body.isTermosAceitos())
                .build();

        novoStudio.aplicarVerificacaoCnpj(cnpj);

        Studio s = studioRepository.save(novoStudio);

        if(body.getEndereco() != null){
            Endereco e = enderecoService.salvar(body.getEndereco(), null);
            s.setEnderecoId(e.getEnderecoId());
        }

        return s;
    }

    /**
     * Estúdio próprio do tatuador (contrato "dono"), sem conta de estúdio:
     * o tatuador gerencia pelo modo estúdio. Usado no cadastro do artista e
     * quando ele abre o estúdio depois.
     */
    @Transactional
    public Studio criarEstudioSolo(Artist dono, EstudioSoloDTO solo, ResultadoCnpj cnpj) {
        if (studioRepository.existsByCnpj(solo.cnpj())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um estúdio com este CNPJ");
        }
        Endereco e = enderecoService.salvar(solo.endereco(), null);
        Studio estudio = Studio.builder()
                .nome(solo.nome().trim())
                .cnpj(solo.cnpj())
                .telefone(dono.getTelefone())
                .enderecoId(e.getEnderecoId())
                .termosAceitos(dono.isTermosAceitos())
                .build();
        estudio.aplicarVerificacaoCnpj(cnpj);
        studioRepository.save(estudio);
        contratoService.criarDono(estudio.getEstudioId(), dono.getTatuadorId());
        return estudio;
    }

    public StudioDTO meuEstudio(UsuarioLogado logado) {
        return StudioDTO.from(exigirEstudioDoUser(logado));
    }

    @Transactional
    public StudioDTO atualizarEstudio(UsuarioLogado logado, AtualizarEstudioDTO body) {
        Studio estudio = exigirEstudioDoUser(logado);

        // Mesma quantidade: nada muda (nem escrita no banco).
        if (body.posicoes() == estudio.getPosicoes()) {
            return StudioDTO.from(estudio);
        }

        if (body.posicoes() < estudio.getPosicoes()
                && sessionRepository.existeReservaFuturaAcimaDaPosicao(
                        estudio.getEstudioId(), body.posicoes(), LocalDateTime.now(), AppointmentStatus.cancelada)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Existem sessoes futuras em posicoes acima de " + body.posicoes());
        }

        estudio.setPosicoes(body.posicoes());
        return StudioDTO.from(studioRepository.save(estudio));
    }

    @Transactional
    public ConviteDTO convidarTatuador(UsuarioLogado logado, UUID tatuadorId, ContratoInputDTO contrato) {
        Studio estudio = exigirEstudioDoUser(logado);

        Artist tatuador = artistRepository.findById(tatuadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tatuador nao encontrado"));

        if (contratoService.estudioColaborador(tatuadorId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tatuador ja é colaborador de um estudio");
        }

        if (contratoService.estudioProprio(tatuadorId).filter(estudio.getEstudioId()::equals).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voce ja é o dono deste estudio");
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
    public ConviteDTO cancelarConvite(UsuarioLogado logado, UUID conviteId) {
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

    public List<ConviteDetalheDTO> listarConvitesPendentes(UsuarioLogado logado) {
        Studio estudio = exigirEstudioDoUser(logado);
        return contratoService.comContratos(
                conviteEstudioRepository.listarDetalhesDoEstudio(estudio.getEstudioId(), ConviteStatus.pendente));
    }

    public List<ColaboradorDTO> listarColaboradores(UsuarioLogado logado) {
        Studio estudio = exigirEstudioDoUser(logado);
        List<ColaboradorDTO> colaboradores = artistRepository.listarColaboradores(estudio.getEstudioId(), ContratoStatus.ativo);

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
    public void removerColaborador(UsuarioLogado logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);

        if (contratoService.estudioProprio(tatuadorId).filter(estudio.getEstudioId()::equals).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O dono nao pode ser removido do proprio estudio");
        }

        exigirColaborador(estudio, tatuadorId);
        contratoService.encerrarVinculo(estudio.getEstudioId(), tatuadorId);
    }


    public ContratoDTO proporContrato(UsuarioLogado logado, UUID tatuadorId, ContratoInputDTO contrato) {
        Studio estudio = exigirEstudioDoUser(logado);
        exigirColaborador(estudio, tatuadorId);
        return ContratoDTO.from(contratoService.proporRenegociacao(estudio.getEstudioId(), tatuadorId, contrato));
    }

    public ContratoDTO cancelarPropostaContrato(UsuarioLogado logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);
        exigirColaborador(estudio, tatuadorId);
        return ContratoDTO.from(contratoService.cancelarRenegociacao(estudio.getEstudioId(), tatuadorId));
    }

    public List<ContratoDTO> historicoContratos(UsuarioLogado logado, UUID tatuadorId) {
        Studio estudio = exigirEstudioDoUser(logado);
        return contratoService.historico(estudio.getEstudioId(), tatuadorId);
    }

    // Garante que a proposta e de renegociacao: quem nao e da equipe so recebe contrato via convite
    private void exigirColaborador(Studio estudio, UUID tatuadorId) {
        boolean colaborador = contratoService.estudioColaborador(tatuadorId)
                .filter(estudio.getEstudioId()::equals)
                .isPresent();
        if (!colaborador) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador nao encontrado");
        }
    }


    public Studio exigirEstudioDoUser(UsuarioLogado user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sem usuario autenticado");
        }
        if ("tatuador".equals(user.papel())) {
            Artist artist = artistRepository.findByAuthId(user.authId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil tatuador nao encontrado"));
            return contratoService.estudioProprio(artist.getTatuadorId())
                    .flatMap(studioRepository::findById)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Voce nao tem estudio proprio"));
        }
        return studioRepository.findByAuthId(user.authId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao possui perfil de estudio"));
    }


    public List<ArtistStudioSearchResultDTO> buscarTatuadores(UsuarioLogado logado, String termo) {
        exigirEstudioDoUser(logado);
        String t = termo == null ? "" : termo.trim().replaceFirst("^@", "");
        if (t.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe ao menos 2 caracteres");
        }
        return artistRepository.buscarParaConvite(t).stream()
                .map(ArtistStudioSearchResultDTO::fromProjection)
                .toList();
    }

    public List<HorarioDTO> meusHorarios(UsuarioLogado logado) {
        return horarioService.listar(exigirEstudioDoUser(logado).getEstudioId());
    }

    @Transactional
    public List<HorarioDTO> atualizarHorarios(UsuarioLogado logado, List<HorarioDTO> horarios) {
        UUID estudioId = exigirEstudioDoUser(logado).getEstudioId();
        horarioService.substituir(estudioId, horarios);
        return horarioService.listar(estudioId);
    }

}
