package com.rabisko.mvp.user.controller;

import com.rabisko.mvp.artist.domain.RegisterArtistaDTO;
import com.rabisko.mvp.studio.domain.RegisterEstudioDTO;
import com.rabisko.mvp.user.domain.ExcludeDTO;
import com.rabisko.mvp.user.domain.LoginResponseDTO;
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.user.domain.UserDTO;
import com.rabisko.mvp.user.domain.UserResponseDTO;
import com.rabisko.mvp.shared.infraestrutura.security.TokenService;
import com.rabisko.mvp.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private TokenService tokenService;


    @PostMapping("/cadastro/cliente")
    public ResponseEntity<?> cadastrarCliente(@RequestBody @Valid UserDTO body) {
        try {
            User salvo = userService.cadastrarCliente(body);
            return ResponseEntity.status(201).body(new LoginResponseDTO(tokenService.generateToken(salvo)));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CPF ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/cadastro/artista")
    public ResponseEntity<?> cadastrarArtista(@RequestBody @Valid RegisterArtistaDTO body) {
        try {
            User salvo = userService.cadastrarArtista(body);
            return ResponseEntity.status(201).body(new LoginResponseDTO(tokenService.generateToken(salvo)));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CPF ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/cadastro/estudio")
    public ResponseEntity<?> cadastrarEstudio(@RequestBody @Valid RegisterEstudioDTO body) {
        try {
            User salvo = userService.cadastrarEstudio(body);
            return ResponseEntity.status(201).body(new LoginResponseDTO(tokenService.generateToken(salvo)));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail ou CNPJ ja esta em uso.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }


    @DeleteMapping("/excluir-conta")
    public ResponseEntity<String> excluirUser(@RequestBody @Valid ExcludeDTO body) {
        try {
            userService.excluirUser(body);
            return ResponseEntity.status(200).body("Usuario excluido com sucesso!");
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(400).body("Erro no banco: este E-mail nao existe.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }


    /**
     * GET /user/me — devolve os dados do usuario logado.
     *
     * @AuthenticationPrincipal: anotacao do Spring Security que injeta
     * o User que esta logado. Quem coloca esse user la dentro e o
     * SecurityFilter (que leu o JWT do header Authorization).
     *
     * Devolvemos UserResponseDTO (nao User direto) pra nao vazar o
     * hash de senha e flags internas.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(UserResponseDTO.fromUser(user));
    }
}
