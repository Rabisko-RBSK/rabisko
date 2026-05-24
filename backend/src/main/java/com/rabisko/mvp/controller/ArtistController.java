package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.artist.ArtistProfileDTO;
import com.rabisko.mvp.domain.artist.ArtistSearchResultDTO;
import com.rabisko.mvp.domain.artist.UploadResponseDTO;
import com.rabisko.mvp.domain.avaliacao.AvaliacaoDTO;
import com.rabisko.mvp.domain.portfolio.PortfolioImagemDTO;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.service.ArtistService;
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

// =====================================================================
// CONTROLLER ArtistController — endpoints do recurso "artist".
//
// Tres familias de endpoints:
//
//   1) BUSCA PUBLICA (cliente procurando tatuador):
//      - GET  /artist/search
//
//   2) PERFIL DO TATUADOR LOGADO (o tatuador olhando/editando o proprio):
//      - GET   /artist/me                      perfil + portfolio
//      - PATCH /artist/me                      atualiza bio / fotoUrl
//      - POST  /artist/me/foto                 upload foto perfil -> URL
//      - POST  /artist/me/portfolio            upload imagem portfolio
//      - DELETE /artist/me/portfolio/{id}      remove imagem portfolio
//
//   3) AVALIACOES (visivel por qualquer logado):
//      - GET   /artist/{id}/avaliacoes
//
// AUTH: nenhum endpoint aqui usa permitAll — todos exigem JWT valido
// (regra default do SecurityConfiguration). O User logado chega via
// @AuthenticationPrincipal pra os endpoints /me — eles inferem o
// tatuadorId via ArtistRepository.findByUserId.
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

    // -----------------------------------------------------------------
    // /artist/me — perfil do tatuador logado
    // -----------------------------------------------------------------

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

    // -----------------------------------------------------------------
    // /artist/{id}/avaliacoes — leitura publica (entre usuarios logados)
    // -----------------------------------------------------------------

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
