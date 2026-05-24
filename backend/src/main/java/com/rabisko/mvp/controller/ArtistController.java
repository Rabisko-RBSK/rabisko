package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.artist.ArtistDashboardDTO;
import com.rabisko.mvp.domain.artist.ArtistSearchResultDTO;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.service.ArtistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// =====================================================================
// CONTROLLER ArtistController — endpoints do recurso "artist".
//
// Endpoints disponiveis:
//   GET /artist/search    : busca de tatuadores por estilo e/ou distancia
//   GET /artist/dashboard : metricas da home do tatuador logado
//
// AUTH: nao tem permitAll, entao herda o padrao do SecurityConfiguration
//   = exige JWT valido. /search e aberto a qualquer usuario logado;
//   /dashboard adicionalmente exige role=tatuador (checado no service).
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

    /**
     * GET /artist/dashboard
     *
     * Devolve os numeros que aparecem na home do tatuador logado.
     * O User logado vem do JWT via @AuthenticationPrincipal. O service
     * valida que o role e tatuador antes de calcular as metricas.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ArtistDashboardDTO> dashboard(@AuthenticationPrincipal User logado) {
        return ResponseEntity.ok(artistService.dashboard(logado));
    }
}
