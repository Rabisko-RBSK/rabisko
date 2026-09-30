package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.artist.domain.Artist;
import com.rabisko.mvp.artist.domain.ArtistDTO;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.studio.domain.ConviteDTO;
import com.rabisko.mvp.studio.domain.ConviteEstudio;
import com.rabisko.mvp.studio.domain.ConviteStatus;
import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.studio.domain.Studio;
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

    public Studio cadastrarEstudio(User user, RegisterEstudioDTO body) {
        Studio novoStudio = Studio.builder()
                .userId(user.getUserId())
                .nome(user.getNome())
                .email(user.getEmail())
                .cnpj(body.getCnpj())
                .telefone(body.getTelefone())
                .build();

        return studioRepository.save(novoStudio);
    }

    public ConviteDTO convidarTatuador(User logado, UUID tatuadorId) {
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
            return ConviteDTO.from(conviteEstudioRepository.saveAndFlush(convite));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um convite pendente para este tatuador");
        }
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

        convite.setStatus(ConviteStatus.cancelado);
        convite.setDataResposta(LocalDateTime.now());
        return ConviteDTO.from(convite);
    }

    public List<ConviteDTO> listarConvitesPendentes(User logado) {
        Studio estudio = exigirEstudioDoUser(logado);

        return conviteEstudioRepository
                .findByEstudioIdAndStatus(estudio.getEstudioId(), ConviteStatus.pendente)
                .stream()
                .map(ConviteDTO::from)
                .toList();
    }

    public List<ArtistDTO> listarColaboradores(User logado) {
        Studio estudio = exigirEstudioDoUser(logado);

        return artistRepository.findByEstudioId(estudio.getEstudioId())
                .stream()
                .map(ArtistDTO::from)
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
}
