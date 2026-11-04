package com.rabisko.mvp.studio.controller;

import com.rabisko.mvp.studio.domain.EstudioPublicoDTO;
import com.rabisko.mvp.studio.domain.StudioSearchResultDTO;
import com.rabisko.mvp.studio.service.EstudioPublicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Estúdios para o cliente. Fica fora de /studio/** porque aquela rota é só
 * para o próprio estúdio (papéis ESTUDIO e TATUADOR).
 */
@RestController
@RequestMapping("/estudios")
public class EstudioPublicoController {

    @Autowired private EstudioPublicoService estudioPublicoService;

    /** GET /estudios/busca — mesmos filtros de GET /artist/search. */
    @GetMapping("/busca")
    public List<StudioSearchResultDTO> buscar(
            @RequestParam(required = false) List<String> estilo,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double raioKm) {
        return estudioPublicoService.buscar(estilo, lat, lng, raioKm);
    }

    /** GET /estudios/{id} — perfil público, com a equipe e o tatuador dono. */
    @GetMapping("/{estudioId}")
    public EstudioPublicoDTO perfil(@PathVariable UUID estudioId) {
        return estudioPublicoService.perfil(estudioId);
    }
}
