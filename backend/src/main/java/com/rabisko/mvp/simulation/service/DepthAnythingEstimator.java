package com.rabisko.mvp.simulation.service;

import java.awt.Dimension;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import jakarta.annotation.PreDestroy;

/**
 * Estimativa de profundidade monocular com o Depth Anything V2 Small via ONNX Runtime.
 *
 * A rede recebe uma única foto e devolve a profundidade relativa de cada pixel (disparidade:
 * quanto maior, mais perto da câmera). No simulador ela gera o {@link DepthMap} da foto base,
 * que o front vai usar para calcular o relevo da pele com WebGL.
 *
 * O pré-processamento segue o do repositório oficial e do DPTImageProcessor (Hugging Face):
 * lado menor redimensionado para 518 px mantendo a proporção, lados múltiplos de 14 (tamanho do
 * patch do ViT), interpolação bicúbica e normalização com média/desvio do ImageNet.
 *
 * O modelo (~99 MB, export do onnx-community, licença Apache-2.0) não fica no repositório: é baixado
 * na primeira execução para {@code simulation.depth.model-path} (ver {@link OnnxModel}).
 */
@Component
public class DepthAnythingEstimator {

    private static final int INPUT_SIZE = 518;
    private static final int PATCH_SIZE = 14;
    // A atenção do ViT cresce com o quadrado do número de patches: em imagens muito alongadas
    // o lado maior é limitado para o tempo e a memória da inferência não explodirem.
    private static final int MAX_INPUT_SIDE = 2 * INPUT_SIZE;
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD = {0.229f, 0.224f, 0.225f};

    private final OnnxModel model;
    private final boolean preload;

    public DepthAnythingEstimator(
            @Value("${simulation.depth.model-path:models/depth_anything_v2_small.onnx}") String modelPath,
            @Value("${simulation.depth.model-url:https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx}") String modelUrl,
            @Value("${simulation.depth.preload:true}") boolean preload) {
        this.model = new OnnxModel("Depth Anything V2 Small", modelPath, modelUrl);
        this.preload = preload;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void preloadModel() {
        if (preload) {
            model.preloadInBackground();
        }
    }

    /** Gera o mapa de profundidade da imagem, normalizado para [0, 1] (1 = mais perto). */
    public DepthMap estimate(BufferedImage image) throws IOException, OrtException {
        OrtSession session = model.session();
        Dimension size = inputSize(image.getWidth(), image.getHeight());
        int width = size.width;
        int height = size.height;

        BufferedImage resized = resize(image, width, height);
        int[] rgb = resized.getRGB(0, 0, width, height, null, 0, width);

        // Tensor no formato NCHW: [1, 3, altura, largura]
        int planeSize = width * height;
        FloatBuffer input = FloatBuffer.allocate(3 * planeSize);
        for (int i = 0; i < planeSize; i++) {
            int pixel = rgb[i];
            input.put(i, (((pixel >> 16) & 0xFF) / 255f - MEAN[0]) / STD[0]);
            input.put(planeSize + i, (((pixel >> 8) & 0xFF) / 255f - MEAN[1]) / STD[1]);
            input.put(2 * planeSize + i, ((pixel & 0xFF) / 255f - MEAN[2]) / STD[2]);
        }

        String inputName = session.getInputNames().iterator().next();
        try (OnnxTensor tensor = OnnxTensor.createTensor(model.environment(), input, new long[]{1, 3, height, width});
             OrtSession.Result result = session.run(Collections.singletonMap(inputName, tensor))) {

            // Saída "predicted_depth": [1, altura, largura]
            OnnxTensor output = (OnnxTensor) result.get(0);
            long[] shape = output.getInfo().getShape();
            int outHeight = (int) shape[1];
            int outWidth = (int) shape[2];
            float[] depth = new float[outWidth * outHeight];
            output.getFloatBuffer().get(depth);

            float min = Float.MAX_VALUE;
            float max = -Float.MAX_VALUE;
            for (float value : depth) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
            float range = max - min;
            for (int i = 0; i < depth.length; i++) {
                depth[i] = range > 0 ? (depth[i] - min) / range : 0f;
            }
            return new DepthMap(outWidth, outHeight, depth);
        }
    }

    /**
     * Tamanho de entrada da rede: lado menor em 518 px mantendo a proporção (lado maior limitado a
     * {@link #MAX_INPUT_SIDE}), com os dois lados arredondados para múltiplos de 14.
     */
    static Dimension inputSize(int width, int height) {
        double scale = Math.min(
                (double) INPUT_SIZE / Math.min(width, height),
                (double) MAX_INPUT_SIDE / Math.max(width, height));
        return new Dimension(toPatchMultiple(width * scale), toPatchMultiple(height * scale));
    }

    private static int toPatchMultiple(double value) {
        return Math.max(PATCH_SIZE, (int) Math.round(value / PATCH_SIZE) * PATCH_SIZE);
    }

    /**
     * Redimensiona com interpolação bicúbica. Numa redução grande (foto de 12 MP para ~518 px) a
     * bicúbica do Java2D só olha 4x4 vizinhos por pixel e gera serrilhado, que a rede confunde com
     * textura/relevo. Por isso a imagem é reduzida pela metade em passos até ficar a menos de 2x do
     * tamanho final. A saída é RGB sem alpha: áreas transparentes viram preto.
     */
    private static BufferedImage resize(BufferedImage source, int width, int height) {
        BufferedImage current = source;
        while (current.getWidth() / 2 >= width && current.getHeight() / 2 >= height) {
            current = draw(current, current.getWidth() / 2, current.getHeight() / 2);
        }
        return draw(current, width, height);
    }

    private static BufferedImage draw(BufferedImage source, int width, int height) {
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = target.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(source, 0, 0, width, height, null);
        g2d.dispose();
        return target;
    }

    @PreDestroy
    public void close() throws OrtException {
        model.close();
    }
}
