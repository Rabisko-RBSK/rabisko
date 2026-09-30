package com.rabisko.mvp.studio.controller;

import com.rabisko.mvp.studio.domain.ColaboradorDTO;
import com.rabisko.mvp.studio.domain.ConviteDTO;
import com.rabisko.mvp.studio.domain.ConviteDetalheDTO;
import com.rabisko.mvp.studio.domain.CriarConviteDTO;
import com.rabisko.mvp.studio.service.StudioService;
import com.rabisko.mvp.user.domain.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/studio")
public class StudioController {

    @Autowired
    private StudioService studioService;

    @GetMapping("/me/convites")
    public ResponseEntity<List<ConviteDetalheDTO>> listarConvites(
            @AuthenticationPrincipal User logado
    ) {
        return ResponseEntity.ok(studioService.listarConvitesPendentes(logado));
    }

    @PostMapping("/me/convites")
    public ResponseEntity<ConviteDTO> criarConvite(
            @AuthenticationPrincipal User logado,
            @RequestBody @Valid CriarConviteDTO body
    ) {
        ConviteDTO convite = studioService.convidarTatuador(logado, body.tatuadorId());
        return ResponseEntity.status(HttpStatus.CREATED).body(convite);
    }

    @DeleteMapping("/me/convites/{conviteId}")
    public ResponseEntity<ConviteDTO> cancelarConvite(
            @AuthenticationPrincipal User logado,
            @PathVariable UUID conviteId
    ) {
        return ResponseEntity.ok(studioService.cancelarConvite(logado, conviteId));
    }

    @GetMapping("/me/colaboradores")
    public ResponseEntity<List<ColaboradorDTO>> listarColaboradores(
            @AuthenticationPrincipal User logado
    ) {
        return ResponseEntity.ok(studioService.listarColaboradores(logado));
    }

    @DeleteMapping("/me/colaboradores/{tatuadorId}")
    public ResponseEntity<Void> removerColaborador(
            @AuthenticationPrincipal User logado,
            @PathVariable UUID tatuadorId
    ) {
        studioService.removerColaborador(logado, tatuadorId);
        return ResponseEntity.noContent().build();
    }
}

