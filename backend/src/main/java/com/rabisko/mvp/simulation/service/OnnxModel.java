package com.rabisko.mvp.simulation.service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;

/**
 * Modelo ONNX usado pelo simulador (U2Net, Depth Anything).
 *
 * Os arquivos .onnx não ficam no repositório: são baixados na primeira execução para
 * {@code modelPath} e reaproveitados nas próximas. A sessão do ONNX Runtime é criada uma única
 * vez, sob demanda, e compartilhada entre as requisições ({@link OrtSession#run} é thread-safe).
 */
class OnnxModel implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(OnnxModel.class);

    private final String name;
    private final Path modelPath;
    private final String modelUrl;

    private final OrtEnvironment env = OrtEnvironment.getEnvironment();
    private volatile OrtSession session;

    OnnxModel(String name, String modelPath, String modelUrl) {
        this.name = name;
        this.modelPath = Path.of(modelPath);
        this.modelUrl = modelUrl;
    }

    OrtEnvironment environment() {
        return env;
    }

    /**
     * Carrega o modelo em segundo plano, para que a primeira requisição não pague o custo
     * do download + inicialização.
     */
    void preloadInBackground() {
        Thread.ofVirtual().name("onnx-preload-" + name).start(() -> {
            try {
                session();
            } catch (Exception e) {
                log.error("===> [SIMULADOR] Falha ao pré-carregar o modelo {}: {}", name, e.getMessage(), e);
            }
        });
    }

    OrtSession session() throws IOException, OrtException {
        OrtSession current = session;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (session == null) {
                ensureDownloaded();
                long start = System.currentTimeMillis();
                OrtSession.SessionOptions options = new OrtSession.SessionOptions();
                options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
                session = env.createSession(modelPath.toString(), options);
                log.info("===> [SIMULADOR] Modelo {} carregado em {}ms", name, System.currentTimeMillis() - start);
            }
            return session;
        }
    }

    private void ensureDownloaded() throws IOException {
        if (Files.exists(modelPath)) {
            return;
        }
        log.info("===> [SIMULADOR] Modelo {} não encontrado em {}. Baixando de {}", name, modelPath.toAbsolutePath(), modelUrl);

        Path parent = modelPath.toAbsolutePath().getParent();
        Files.createDirectories(parent);
        Path tempFile = Files.createTempFile(parent, "model-", ".download");

        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(modelUrl)).GET().build();

        try {
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) {
                throw new IOException("Download do modelo " + name + " falhou com status " + response.statusCode());
            }
            try (InputStream body = response.body()) {
                Files.copy(body, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            // Move atômico evita que um download interrompido deixe um modelo corrompido no caminho final
            Files.move(tempFile, modelPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            log.info("===> [SIMULADOR] Modelo {} salvo em {} ({} MB)", name, modelPath.toAbsolutePath(), Files.size(modelPath) / (1024 * 1024));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Download do modelo " + name + " interrompido", e);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Override
    public void close() throws OrtException {
        if (session != null) {
            session.close();
        }
    }
}
