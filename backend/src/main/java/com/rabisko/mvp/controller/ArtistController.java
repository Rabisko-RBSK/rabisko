package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.artist.ArtistSearchResultDTO;
import com.rabisko.mvp.service.ArtistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints publicos do recurso `artist`. Hoje so o /search.
 *
 * Auth: herda do SecurityConfiguration — qualquer endpoint que NAO seja
 * /auth/login ou /user/cadastro/* exige Bearer. Faz sentido: a busca e
 * funcionalidade do app autenticado (cliente logado procurando tatuador).
 *
 * Todos os parametros sao opcionais. Combinacoes validas:
 *  - sem filtro          -> todos os tatuadores ativos
 *  - estilo=A&estilo=B   -> tatuadores com pelo menos um desses estilos
 *  - lat=X&lng=Y         -> distancia <= raioKm (default 25 km no service)
 *  - lat+lng+raioKm      -> raio customizado
 *  - estilo + lat+lng    -> intersecao dos dois filtros
 *
 * Distancia ignora tatuadores sem latitude/longitude cadastrados.
 */
@RestController
@RequestMapping("/artist")
public class ArtistController {

    @Autowired
    private ArtistService artistService;

    @GetMapping("/search")
    public ResponseEntity<List<ArtistSearchResultDTO>> buscar(
            @RequestParam(required = false) List<String> estilo,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double raioKm
    ) {
        return ResponseEntity.ok(artistService.buscar(estilo, lat, lng, raioKm));
    }
}
