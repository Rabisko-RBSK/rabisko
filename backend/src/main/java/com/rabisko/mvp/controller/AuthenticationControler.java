package com.rabisko.mvp.controller;

import com.rabisko.mvp.domain.user.AuthenticationDTO;
import com.rabisko.mvp.domain.user.LoginResponseDTO;
import com.rabisko.mvp.domain.user.User;
import com.rabisko.mvp.infraestrutura.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint de login. Fluxo:
 * 1. Recebe { login (email), senha } no body.
 * 2. Delega ao AuthenticationManager — internamente ele:
 * - chama AuthorizationService.loadUserByUsername(email)
 * - compara a senha plain com o hash BCrypt via PasswordEncoder
 * - lanca AuthenticationException se nao bater
 * 3. Pega o User autenticado (auth.getPrincipal()) e gera o JWT.
 * 4. Devolve { token } — o front salva e injeta no header das proximas
 * requests via interceptor (axios no mobile).
 *
 * Erros sao traduzidos pra HTTP:
 * - 401: credenciais invalidas (mensagem generica, nao revela se foi o
 * email ou a senha — evita user enumeration).
 * - 400: qualquer outro erro inesperado.
 */
@RestController
@RequestMapping("auth")
public class AuthenticationControler {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthenticationDTO data) {
        try {
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.login(), data.senha());
            var auth = this.authenticationManager.authenticate(usernamePassword);

            var token = tokenService.generateToken((User) auth.getPrincipal());
            return ResponseEntity.ok(new LoginResponseDTO(token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login ou senha incorretos");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro na requisicao: " + e.getMessage());
        }
    }
}
