package com.rabisko.mvp.simulation.service;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import jakarta.annotation.PreDestroy;

/**
 * Remoção de fundo com a rede de segmentação U2Net (saliency detection) via ONNX Runtime.
 *
 * O pré e pós-processamento seguem o da biblioteca rembg, de onde vem o modelo .onnx:
 * a imagem é redimensionada para 320x320, normalizada com média/desvio do ImageNet,
 * e a primeira saída da rede (d0) vira a máscara de alpha da imagem original.
 *
 * O modelo (~176 MB) não fica no repositório: é baixado na primeira execução para
 * {@code simulation.u2net.model-path} e reaproveitado nas próximas.
 */
@Component
public class U2NetBackgroundRemover {

    private static final Logger log = LoggerFactory.getLogger(U2NetBackgroundRemover.class);

    private static final int INPUT_SIZE = 320;
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD = {0.229f, 0.224f, 0.225f};

    private final Path modelPath;
    private final String modelUrl;
    private final boolean preload;

    private final OrtEnvironment env = OrtEnvironment.getEnvironment();
    private volatile OrtSession session;

    public U2NetBackgroundRemover(
            @Value("${simulation.u2net.model-path:models/u2net.onnx}") String modelPath,
            @Value("${simulation.u2net.model-url:https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx}") String modelUrl,
            @Value("${simulation.u2net.preload:true}") boolean preload) {
        this.modelPath = Path.of(modelPath);
        this.modelUrl = modelUrl;
        this.preload = preload;
    }

    /**
     * Carrega o modelo em segundo plano assim que a aplicação sobe, para que a
     * primeira requisição não pague o custo do download + inicialização.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void preloadModel() {
        if (!preload) {
            return;
        }
        Thread.ofVirtual().name("u2net-preload").start(() -> {
            try {
                getSession();
            } catch (Exception e) {
                log.error("===> [SIMULADOR] Falha ao pré-carregar o modelo U2Net: {}", e.getMessage(), e);
            }
        });
    }

    /**
     * Retorna uma cópia ARGB da imagem com o fundo transparente.
     * As cores originais são mantidas; apenas o canal alpha é substituído pela máscara.
     */
    public BufferedImage removeBackground(BufferedImage original) throws IOException, OrtException {
        int width = original.getWidth();
        int height = original.getHeight();

        float[] mask = predictMask(original);
        BufferedImage maskImage = resize(toGrayImage(mask), width, height, BufferedImage.TYPE_BYTE_GRAY);
        byte[] maskPixels = ((DataBufferByte) maskImage.getRaster().getDataBuffer()).getData();

        BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        int[] argb = original.getRGB(0, 0, width, height, null, 0, width);
        for (int i = 0; i < argb.length; i++) {
            int originalAlpha = (argb[i] >>> 24) & 0xFF;
            int maskAlpha = maskPixels[i] & 0xFF;
            int alpha = (originalAlpha * maskAlpha) / 255;
            argb[i] = (alpha << 24) | (argb[i] & 0x00FFFFFF);
        }
        result.setRGB(0, 0, width, height, argb, 0, width);
        return result;
    }

    /** Executa a U2Net e devolve a máscara 320x320 normalizada para [0, 1]. */
    private float[] predictMask(BufferedImage original) throws IOException, OrtException {
        OrtSession ortSession = getSession();
        BufferedImage resized = resize(original, INPUT_SIZE, INPUT_SIZE, BufferedImage.TYPE_INT_RGB);
        int[] rgb = resized.getRGB(0, 0, INPUT_SIZE, INPUT_SIZE, null, 0, INPUT_SIZE);

        // Assim como no rembg, os pixels são divididos pelo maior valor da imagem (não por 255 fixo)
        int maxValue = 1;
        for (int pixel : rgb) {
            maxValue = Math.max(maxValue, Math.max((pixel >> 16) & 0xFF, Math.max((pixel >> 8) & 0xFF, pixel & 0xFF)));
        }

        // Tensor no formato NCHW: [1, 3, 320, 320]
        int planeSize = INPUT_SIZE * INPUT_SIZE;
        FloatBuffer input = FloatBuffer.allocate(3 * planeSize);
        for (int i = 0; i < planeSize; i++) {
            int pixel = rgb[i];
            input.put(i, (((pixel >> 16) & 0xFF) / (float) maxValue - MEAN[0]) / STD[0]);
            input.put(planeSize + i, (((pixel >> 8) & 0xFF) / (float) maxValue - MEAN[1]) / STD[1]);
            input.put(2 * planeSize + i, ((pixel & 0xFF) / (float) maxValue - MEAN[2]) / STD[2]);
        }

        String inputName = ortSession.getInputNames().iterator().next();
        try (OnnxTensor tensor = OnnxTensor.createTensor(env, input, new long[]{1, 3, INPUT_SIZE, INPUT_SIZE});
             OrtSession.Result result = ortSession.run(Collections.singletonMap(inputName, tensor))) {

            FloatBuffer output = ((OnnxTensor) result.get(0)).getFloatBuffer();
            float[] prediction = new float[planeSize];
            output.get(prediction);

            float min = Float.MAX_VALUE;
            float max = -Float.MAX_VALUE;
            for (float value : prediction) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
            float range = max - min;
            for (int i = 0; i < prediction.length; i++) {
                prediction[i] = range > 0 ? (prediction[i] - min) / range : 0f;
            }
            return prediction;
        }
    }

    private OrtSession getSession() throws IOException, OrtException {
        OrtSession current = session;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (session == null) {
                ensureModelDownloaded();
                long start = System.currentTimeMillis();
                OrtSession.SessionOptions options = new OrtSession.SessionOptions();
                options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
                session = env.createSession(modelPath.toString(), options);
                log.info("===> [SIMULADOR] Modelo U2Net carregado em {}ms", System.currentTimeMillis() - start);
            }
            return session;
        }
    }

    private void ensureModelDownloaded() throws IOException {
        if (Files.exists(modelPath)) {
            return;
        }
        log.info("===> [SIMULADOR] Modelo U2Net não encontrado em {}. Baixando de {}", modelPath.toAbsolutePath(), modelUrl);

        Path parent = modelPath.toAbsolutePath().getParent();
        Files.createDirectories(parent);
        Path tempFile = Files.createTempFile(parent, "u2net-", ".download");

        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        HttpRequest request = HttpRequest.newBuilder(URI.create(modelUrl)).GET().build();

        try {
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) {
                throw new IOException("Download do modelo U2Net falhou com status " + response.statusCode());
            }
            try (InputStream body = response.body()) {
                Files.copy(body, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            // Move atômico evita que um download interrompido deixe um modelo corrompido no caminho final
            Files.move(tempFile, modelPath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            log.info("===> [SIMULADOR] Modelo U2Net salvo em {} ({} MB)", modelPath.toAbsolutePath(), Files.size(modelPath) / (1024 * 1024));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Download do modelo U2Net interrompido", e);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private static BufferedImage toGrayImage(float[] mask) {
        BufferedImage image = new BufferedImage(INPUT_SIZE, INPUT_SIZE, BufferedImage.TYPE_BYTE_GRAY);
        byte[] pixels = ((DataBufferByte) image.getRaster().getDataBuffer()).getData();
        for (int i = 0; i < mask.length; i++) {
            pixels[i] = (byte) Math.round(mask[i] * 255);
        }
        return image;
    }

    private static BufferedImage resize(BufferedImage source, int width, int height, int type) {
        BufferedImage target = new BufferedImage(width, height, type);
        Graphics2D g2d = target.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(source, 0, 0, width, height, null);
        g2d.dispose();
        return target;
    }

    @PreDestroy
    public void close() throws OrtException {
        if (session != null) {
            session.close();
        }
    }
}
