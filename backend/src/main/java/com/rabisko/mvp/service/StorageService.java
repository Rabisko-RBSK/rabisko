package com.rabisko.mvp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;
import java.util.UUID;

// =====================================================================
// SERVICE StorageService — fala com o Supabase Storage via REST.
//
// Por que REST direto e nao um SDK?
//   O SDK oficial do Supabase pra Java nao existe; o pro JS nao roda
//   aqui. A API REST do Storage e estavel e simples — 1 POST cobre
//   upload, 1 DELETE cobre exclusao.
//
// Fluxo de upload:
//   1) Mobile manda o arquivo multipart para o backend.
//   2) Aqui geramos um nome unico (UUID + ext) e fazemos
//      POST {SUPABASE_URL}/storage/v1/object/{bucket}/{nome}
//      Authorization: Bearer {SERVICE_ROLE_KEY}
//   3) Devolvemos a URL publica para o caller gravar no banco.
//
// IMPORTANTE: usamos a SERVICE_ROLE_KEY, que tem permissao de escrita
// nos buckets. Ela NUNCA pode ser exposta ao cliente — fica so no .env
// do backend. Os buckets profile_images / portfolio_images devem estar
// configurados como `public` no painel do Supabase para que a URL
// retornada (.../object/public/...) seja acessivel sem token.
// =====================================================================

@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String serviceKey;

    @Value("${supabase.bucket.profile:profile_images}")
    private String profileBucket;

    @Value("${supabase.bucket.portfolio:portfolio_images}")
    private String portfolioBucket;

    /** Sobe imagem para o bucket de fotos de perfil; devolve a URL publica. */
    public String uploadFotoPerfil(MultipartFile file) {
        return upload(profileBucket, file);
    }

    /** Sobe imagem para o bucket de portfolio; devolve a URL publica. */
    public String uploadPortfolio(MultipartFile file) {
        return upload(portfolioBucket, file);
    }

    /** Apaga uma imagem do bucket. Best-effort: loga e segue se o objeto sumiu. */
    public void deletePortfolio(String url) {
        deleteByUrl(portfolioBucket, url);
    }

    // -----------------------------------------------------------------

    private String upload(String bucket, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de imagem ausente ou vazio.");
        }
        if (supabaseUrl == null || supabaseUrl.isBlank()
                || serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalStateException(
                    "Supabase Storage nao configurado (defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)."
            );
        }

        String ext = extrairExtensao(file.getOriginalFilename(), file.getContentType());
        String objectName = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectName;
        String contentType = Objects.requireNonNullElse(file.getContentType(), "application/octet-stream");

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Falha ao ler bytes do upload.", e);
        }

        try {
            RestClient.create()
                    .post()
                    .uri(uploadUrl)
                    .header("Authorization", "Bearer " + serviceKey)
                    .header("x-upsert", "true")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(bytes)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String body = new String(res.getBody().readAllBytes());
                        log.warn("Supabase upload falhou ({}): {}", res.getStatusCode(), body);
                        throw new RuntimeException("Supabase rejeitou o upload: " + res.getStatusCode());
                    })
                    .toBodilessEntity();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao subir imagem para o Supabase Storage.", e);
        }

        // URL publica padrao do Supabase Storage (assume bucket publico).
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectName;
    }

    private void deleteByUrl(String bucket, String url) {
        if (url == null || url.isBlank()) return;

        // Extrai o nome do objeto a partir da URL publica.
        String marker = "/storage/v1/object/public/" + bucket + "/";
        int idx = url.indexOf(marker);
        if (idx < 0) {
            log.warn("URL nao reconhecida como do bucket {}: {}", bucket, url);
            return;
        }
        String objectName = url.substring(idx + marker.length());
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectName;

        try {
            RestClient.create()
                    .delete()
                    .uri(deleteUrl)
                    .header("Authorization", "Bearer " + serviceKey)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        log.warn("Supabase delete falhou ({}): {}", res.getStatusCode(), deleteUrl);
                    })
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Falha ao apagar do Supabase (seguindo mesmo assim): {}", e.getMessage());
        }
    }

    /** Deduz extensao a partir do nome original ou do MIME. */
    private String extrairExtensao(String nome, String mime) {
        if (nome != null) {
            int p = nome.lastIndexOf('.');
            if (p > 0 && p < nome.length() - 1) {
                return nome.substring(p + 1).toLowerCase();
            }
        }
        if (mime != null) {
            return switch (mime.toLowerCase()) {
                case "image/jpeg", "image/jpg" -> "jpg";
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                case "image/gif" -> "gif";
                default -> "";
            };
        }
        return "";
    }
}
