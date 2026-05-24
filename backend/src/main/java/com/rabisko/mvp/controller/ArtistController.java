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

// =====================================================================
// CONTROLLER ArtistController — endpoints do recurso "artist".
//
// Hoje so existe um: GET /artist/search.
//
// AUTH: nao tem permitAll, entao herda o padrao do SecurityConfiguration
//   = exige JWT valido. Cliente logado faz busca pra achar tatuador.
//
// Os 4 query params sao TODOS opcionais. Combinacoes validas:
//
//   sem nenhum                -> retorna TODOS os tatuadores ativos
//   estilo=A&estilo=B         -> so tatuadores que fazem A ou B
//   lat=X&lng=Y               -> so dentro do raio default (25 km)
//   lat=X&lng=Y&raioKm=10     -> raio customizado
//   estilo=A&lat=X&lng=Y      -> intersecao dos dois filtros
//
// Tatuadores sem latitude/longitude cadastrados sao IGNORADOS no
// filtro de distancia.
// =====================================================================

@RestController
@RequestMapping("/artist")
public class ArtistController {

    @Autowired
    private ArtistService artistService;

    /**
     * GET /artist/search
     *
     * @RequestParam(required = false): cada parametro pode vir ou nao
     * na URL. Se nao vier, chega como null e o service trata como
     * "filtro desligado".
     */
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
