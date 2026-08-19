package com.rabisko.mvp.artist.controller;

import com.rabisko.mvp.artist.domain.ArtistDashboardDTO;
import com.rabisko.mvp.artist.domain.ArtistProfileDTO;
import com.rabisko.mvp.artist.domain.ArtistSearchResultDTO;
import com.rabisko.mvp.artist.domain.AvaliacaoDTO;
import com.rabisko.mvp.artist.domain.PortfolioImagemDTO;
import com.rabisko.mvp.artist.domain.UploadResponseDTO;
import com.rabisko.mvp.artist.service.ArtistService;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;


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


    /** Devolve o perfil completo do tatuador logado (nome, foto, bio, portfolio). */
    @GetMapping("/me")
    public ResponseEntity<ArtistProfileDTO> obterMeuPerfil(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(artistService.obterPerfil(user));
    }

    /**
     * Atualiza campos do perfil (PATCH).
     *
     * Body aceita as chaves opcionais `bio` e `fotoUrl`. So as chaves
     * PRESENTES sao alteradas — semantica PATCH. Por isso recebemos um
     * Map<String,Object> (record/POJO nao distingue ausencia de null).
     */
    @PatchMapping("/me")
    public ResponseEntity<ArtistProfileDTO> atualizarMeuPerfil(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        return ResponseEntity.ok(artistService.atualizarPerfil(user, payload));
    }

    /**
     * Upload da foto de perfil — multipart, campo `file`. Devolve `{ url }`;
     * o cliente faz PATCH /artist/me a seguir gravando essa URL em fotoUrl.
     */
    @PostMapping("/me/foto")
    public ResponseEntity<UploadResponseDTO> uploadFotoPerfil(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file
    ) {
        String url = artistService.uploadFotoPerfil(user, file);
        return ResponseEntity.ok(new UploadResponseDTO(url));
    }

    /**
     * Upload de uma imagem para o portfolio. Multipart com campo `file` e
     * opcional `descricao`. Devolve a imagem ja persistida (com imagemId).
     */
    @PostMapping("/me/portfolio")
    public ResponseEntity<PortfolioImagemDTO> adicionarImagemPortfolio(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "descricao", required = false) String descricao
    ) {
        return ResponseEntity.ok(artistService.adicionarImagemPortfolio(user, file, descricao));
    }

    /** Remove imagem do portfolio (apaga linha + tenta apagar do Storage). */
    @DeleteMapping("/me/portfolio/{imagemId}")
    public ResponseEntity<Void> removerImagemPortfolio(
            @AuthenticationPrincipal User user,
            @PathVariable UUID imagemId
    ) {
        artistService.removerImagemPortfolio(user, imagemId);
        return ResponseEntity.noContent().build();
    }


    /**
     * Lista avaliacoes recebidas pelo tatuador (qualquer usuario logado
     * pode consultar — pra exibir no perfil do tatuador). STUB: a tabela
     * `avaliacoes` ainda nao existe; devolve lista vazia.
     */
    @GetMapping("/{tatuadorId}/avaliacoes")
    public ResponseEntity<List<AvaliacaoDTO>> listarAvaliacoes(@PathVariable UUID tatuadorId) {
        return ResponseEntity.ok(artistService.listarAvaliacoes(tatuadorId));
    }
}
