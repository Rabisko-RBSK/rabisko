package com.rabisko.mvp.client.controller;

import com.rabisko.mvp.client.domain.AtualizarClienteDTO;
import com.rabisko.mvp.client.domain.ClientePerfilDTO;
import com.rabisko.mvp.client.service.ClientService;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Perfil do cliente logado (tela "Meu Perfil" nas Configurações). */
@RestController
@RequestMapping("/client")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping("/me")
    public ClientePerfilDTO meuPerfil(@AuthenticationPrincipal UsuarioLogado logado) {
        return clientService.meuPerfil(logado);
    }

    @PatchMapping("/me")
    public ClientePerfilDTO atualizarPerfil(
            @AuthenticationPrincipal UsuarioLogado logado,
            @RequestBody @Valid AtualizarClienteDTO body) {
        return clientService.atualizarPerfil(logado, body);
    }
}
