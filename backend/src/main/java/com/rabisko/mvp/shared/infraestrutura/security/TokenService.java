package com.rabisko.mvp.shared.infraestrutura.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.rabisko.mvp.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;


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
                    .withSubject(user.getEmail())
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
