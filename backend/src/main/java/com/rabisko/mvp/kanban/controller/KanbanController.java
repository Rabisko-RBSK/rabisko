package com.rabisko.mvp.kanban.controller;

import com.rabisko.mvp.kanban.domain.KanbanCardDTO;
import com.rabisko.mvp.kanban.service.KanbanService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Kanban de serviços (tela Serviços do app), somente leitura. Os cards vêm
 * ordenados por coluna; o app só agrupa.
 */
@RestController
public class KanbanController {

    @Autowired
    private KanbanService kanbanService;

    /** GET /artist/me/servicos — serviços e chats do tatuador logado. */
    @GetMapping("/artist/me/servicos")
    public List<KanbanCardDTO> doTatuador(@AuthenticationPrincipal UsuarioLogado logado) {
        return kanbanService.doTatuador(logado);
    }

    /**
     * GET /studio/me/servicos — serviços do estúdio logado (ou do estúdio próprio
     * do tatuador no modo estúdio), de todos os tatuadores da equipe.
     */
    @GetMapping("/studio/me/servicos")
    public List<KanbanCardDTO> doEstudio(@AuthenticationPrincipal UsuarioLogado logado) {
        return kanbanService.doEstudio(logado);
    }
}
