package com.rabisko.mvp.studio.service;

import com.rabisko.mvp.artist.domain.FiltroBusca;
import com.rabisko.mvp.artist.repository.ArtistRepository;
import com.rabisko.mvp.endereco.service.EnderecoService;
import com.rabisko.mvp.horario.service.HorarioService;
import com.rabisko.mvp.studio.domain.ContratoStatus;
import com.rabisko.mvp.studio.domain.EstudioPublicoDTO;
import com.rabisko.mvp.studio.domain.Studio;
import com.rabisko.mvp.studio.domain.StudioSearchResultDTO;
import com.rabisko.mvp.studio.repository.StudioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/** Estúdios vistos pelo cliente: busca e perfil público. */
@Service
public class EstudioPublicoService {

    @Autowired private StudioRepository studioRepository;
    @Autowired private ArtistRepository artistRepository;
    @Autowired private ContratoService contratoService;
    @Autowired private HorarioService horarioService;
    @Autowired private EnderecoService enderecoService;

    public List<StudioSearchResultDTO> buscar(List<String> estilos, Double lat, Double lng, Double raioKm) {
        FiltroBusca f = FiltroBusca.de(estilos, lat, lng, raioKm);
        return studioRepository.buscar(f.semEstilo(), f.estilos(), f.semDistancia(), f.lat(), f.lng(), f.raioKm())
                .stream()
                .map(StudioSearchResultDTO::fromProjection)
                .toList();
    }

    public EstudioPublicoDTO perfil(UUID estudioId) {
        Studio estudio = studioRepository.findById(estudioId)
                .filter(Studio::isStatusAtivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estúdio não encontrado"));

        return new EstudioPublicoDTO(
                estudio.getEstudioId(),
                estudio.getNome(),
                estudio.getTelefone(),
                estudio.getFotoPerfilUrl(),
                enderecoService.buscar(estudio.getEnderecoId()),
                horarioService.listar(estudioId),
                artistRepository.listarColaboradores(estudioId, ContratoStatus.ativo),
                contratoService.donoDoEstudio(estudioId).orElse(null));
    }
}
