package com.rabisko.mvp.shared.infraestrutura.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;


/**
 * Cria e apaga contas no Supabase Auth pela Admin API, usando a service key.
 * As contas sao criadas ja confirmadas e com o papel em `app_metadata.role`,
 * que o SupabaseJwtConverter le de dentro do token. So o backend tem a
 * service key — o app nunca deve receber essa chave.
 */
@Service
public class SupabaseAuthAdmin {

    private static final Logger log = LoggerFactory.getLogger(SupabaseAuthAdmin.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String serviceKey;

    /**
     * Cria a conta e devolve o id dela em auth.users (o authId do perfil).
     * E-mail repetido ou senha fraca viram IllegalArgumentException (400).
     */
    public UUID criarConta(String email, String senha, String papel) {
        Map<String, Object> body = Map.of(
                "email", email,
                "password", senha,
                "email_confirm", true,
                "app_metadata", Map.of("role", papel)
        );

        Map<?, ?> resposta = RestClient.create()
                .post()
                .uri(supabaseUrl + "/auth/v1/admin/users")
                .header("apikey", serviceKey)
                .header("Authorization", "Bearer " + serviceKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String erro = new String(res.getBody().readAllBytes());
                    if (erro.contains("email_exists")) {
                        throw new IllegalArgumentException("E-mail ja cadastrado!");
                    }
                    if (erro.contains("weak_password")) {
                        throw new IllegalArgumentException("Senha fraca: use pelo menos 8 caracteres.");
                    }
                    log.warn("Supabase Auth recusou o cadastro ({}): {}", res.getStatusCode(), erro);
                    throw new IllegalStateException("Falha ao criar conta no Supabase Auth");
                })
                .body(Map.class);

        return UUID.fromString((String) resposta.get("id"));
    }

    /**
     * Apaga a conta; o `on delete cascade` apaga o perfil (cliente, tatuador
     * ou estudio). Diferente do delete do Storage, a falha NAO e engolida:
     * e usado na compensacao do cadastro e no DELETE /user/me.
     */
    public void excluirConta(UUID authId) {
        RestClient.create()
                .delete()
                .uri(supabaseUrl + "/auth/v1/admin/users/" + authId)
                .header("apikey", serviceKey)
                .header("Authorization", "Bearer " + serviceKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String erro = new String(res.getBody().readAllBytes());
                    log.error("Supabase Auth nao apagou a conta {} ({}): {}", authId, res.getStatusCode(), erro);
                    throw new IllegalStateException("Falha ao excluir conta no Supabase Auth");
                })
                .toBodilessEntity();
    }
}
