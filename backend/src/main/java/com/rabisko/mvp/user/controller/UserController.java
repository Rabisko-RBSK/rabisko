package com.rabisko.mvp.user.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rabisko.mvp.artist.domain.RegisterArtistaDTO;
import com.rabisko.mvp.shared.infraestrutura.security.UsuarioLogado;
import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.user.domain.UserDTO;
import com.rabisko.mvp.user.domain.UserResponseDTO;
import com.rabisko.mvp.user.service.UserService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;


    @PostMapping("/cadastro/cliente")
    public ResponseEntity<?> cadastrarCliente(@RequestBody @Valid UserDTO body) {
        try {
            userService.cadastrarCliente(body);
            return ResponseEntity.status(201).build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CPF ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/cadastro/artista")
    public ResponseEntity<?> cadastrarArtista(@RequestBody @Valid RegisterArtistaDTO body) {
        try {
            userService.cadastrarArtista(body);
            return ResponseEntity.status(201).build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CPF ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/cadastro/estudio")
    public ResponseEntity<?> cadastrarEstudio(@RequestBody @Valid RegisterEstudioDTO body) {
        try {
            userService.cadastrarEstudio(body);
            return ResponseEntity.status(201).build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CNPJ ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }


    @DeleteMapping("/me")
    public ResponseEntity<Void> excluirUser(@AuthenticationPrincipal UsuarioLogado logado) {
        userService.excluirConta(logado);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(@AuthenticationPrincipal UsuarioLogado user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.me(user));
    }
}
