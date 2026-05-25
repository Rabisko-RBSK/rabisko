package com.rabisko.mvp.user.controller;

import com.rabisko.mvp.user.domain.AuthenticationDTO;
import com.rabisko.mvp.user.domain.LoginResponseDTO;
import com.rabisko.mvp.user.domain.User;
import com.rabisko.mvp.shared.infraestrutura.security.TokenService;
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

// =====================================================================
// CONTROLLER AuthenticationControler — endpoint de LOGIN.
//
// O que e um Controller no Spring?
//   Uma classe marcada com @RestController e o "porteiro" da API:
//   recebe requisicoes HTTP, delega pra camada de servico, e devolve
//   a resposta como JSON.
//
//   @RestController = @Controller + @ResponseBody (o retorno vira JSON
//                                                  no body da resposta)
//   @RequestMapping("auth") = todos os endpoints aqui comecam com /auth
//   @PostMapping("/login")  = mapeia POST /auth/login pra este metodo
//
// Fluxo do login:
//   1) Front manda { login (email), senha } no body
//   2) Spring Security autentica (chama AuthorizationService por baixo
//      e compara senha digitada com hash BCrypt no banco)
//   3) Se OK, geramos um JWT e devolvemos
//   4) Front guarda o token e usa em todas as proximas requisicoes
//
// Tratamento de erro:
//   - AuthenticationException -> 401 com msg generica "Login ou senha
//     incorretos" (NUNCA dizer se foi a senha ou o email — evita
//     "user enumeration", tecnica em que um atacante descobre quais
//     emails existem no sistema)
//   - Qualquer outro erro -> 400
// =====================================================================

@RestController
@RequestMapping("auth")
public class AuthenticationControler {

    @Autowired
    private TokenService tokenService;

    @Autowired
    private AuthenticationManager authenticationManager;     // configurado em SecurityConfiguration

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AuthenticationDTO data) {
        try {
            // 1) Empacota email+senha no formato que o Spring Security espera
            var usernamePassword = new UsernamePasswordAuthenticationToken(data.login(), data.senha());

            // 2) Autentica: aqui dentro o Spring chama o AuthorizationService,
            //    busca o User pelo email e compara a senha digitada com o
            //    hash do banco usando BCrypt. Se nao bater, lanca excecao.
            var auth = this.authenticationManager.authenticate(usernamePassword);

            // 3) Gera o JWT a partir do User autenticado
            var token = tokenService.generateToken((User) auth.getPrincipal());

            return ResponseEntity.ok(new LoginResponseDTO(token));

        } catch (AuthenticationException e) {
            // Senha errada ou email inexistente — mensagem GENERICA.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login ou senha incorretos");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro na requisicao: " + e.getMessage());
        }
    }
}
