package com.rabisko.mvp.infraestrutura.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.rabisko.mvp.domain.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

// =====================================================================
// SERVICE TokenService — emite e valida JWT (JSON Web Token).
//
// O que e um JWT?
//   E uma string em 3 partes separadas por ponto: HEADER.PAYLOAD.SIGNATURE
//   - HEADER    : metadados (algoritmo de assinatura)
//   - PAYLOAD   : dados nao-sigilosos (no nosso caso: o email do usuario)
//   - SIGNATURE : hash criptografico do header + payload, feito com o
//                 nosso segredo. Se alguem alterar o payload, a
//                 assinatura nao bate mais e o token e rejeitado.
//
// HMAC256: algoritmo SIMETRICO. Quem assina e quem verifica usam o MESMO
// segredo. Ideal pra nosso caso, porque os dois sao o mesmo servidor.
//
// Como configuramos o segredo:
//   @Value("${api.security.token.secret}") le do application.properties,
//   que por sua vez le da env var JWT_SECRET (com fallback inseguro em dev).
//   EM PRODUCAO: usar string longa aleatoria (64+ chars).
//
// O QUE o token carrega:
//   - issuer  ("auth-api") : "quem emitiu este token"
//   - subject (email)      : "de quem e este token" — o SecurityFilter
//                            usa pra buscar o User no banco
//   - exp                  : validade (agora + 2h, fuso de Brasilia)
//
// Por que NAO colocar a senha ou dados sensiveis no token?
//   O PAYLOAD do JWT e legivel por qualquer um — so nao da pra ALTERAR
//   sem invalidar a assinatura. Pense nele como um envelope com lacre:
//   da pra ler do lado de fora, mas nao da pra abrir e editar.
// =====================================================================

@Service
public class TokenService {

    @Value("${api.security.token.secret}")
    private String secret;

    /**
     * Cria um JWT pra um User que acabou de logar/cadastrar.
     * Retorna a string compactada que o front salva e manda no header.
     */
    public String generateToken(User user) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer("auth-api")
                    .withSubject(user.getEmail())          // subject = identifica o dono
                    .withExpiresAt(generateExpirationDate())
                    .sign(algorithm);
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro enquanto gerava o token", exception);
        }
    }

    /**
     * Valida 3 coisas: assinatura (segredo bate), issuer (auth-api) e
     * expiracao (nao venceu). Se tudo OK, devolve o subject (email).
     * Se algo falhar, devolve "" (string vazia).
     *
     * Por que devolver "" e nao lancar excecao?
     *   Pra deixar a vida do SecurityFilter mais simples: ele chama,
     *   ve que veio vazio, nao seta usuario e segue em frente. Quem
     *   decide bloquear a rota e o SecurityConfiguration.
     */
    public String validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secret);
            return JWT.require(algorithm)
                    .withIssuer("auth-api")
                    .build()
                    .verify(token)
                    .getSubject();
        } catch (JWTVerificationException exception) {
            return "";
        }
    }

    /**
     * Tempo de vida do token: 2 horas a partir de agora, fuso Brasilia (-03:00).
     * Se for atender outros fusos no futuro, trocar pra UTC.
     */
    private Instant generateExpirationDate() {
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-03:00"));
    }
}
