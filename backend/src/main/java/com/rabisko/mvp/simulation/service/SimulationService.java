package com.rabisko.mvp.simulation.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import ai.onnxruntime.OrtException;
import boofcv.struct.image.GrayU8;
import boofcv.struct.image.Planar;
import boofcv.io.image.ConvertBufferedImage;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import javax.imageio.ImageIO;


@Service
public class SimulationService {

    /**
     * AUTO: analisa a imagem e escolhe entre LINEART e U2NET (ver {@link #isInkOnPaper}).
     * U2NET: segmentação por IA, preserva as cores e funciona com fundos complexos (fotos, texturas).
     * LINEART: algoritmo por brilho, transforma a imagem em traço preto sobre fundo transparente.
     *          Indicado para desenhos em papel branco.
     */
    public enum RemovalMode {
        AUTO,
        U2NET,
        LINEART;

        public static RemovalMode from(String value) {
            try {
                return RemovalMode.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Modo inválido: " + value + ". Use 'auto', 'u2net' ou 'lineart'.");
            }
        }
    }

    // Parâmetros da detecção de "tinta sobre papel" usada no modo AUTO
    private static final int SAMPLE_TARGET = 250_000;       // pixels amostrados no máximo
    private static final int COLOR_SATURATION = 40;         // max(R,G,B) - min(R,G,B) acima disso conta como pixel colorido
    private static final double MAX_COLOR_FRACTION = 0.03;  // até 3% de pixels coloridos (ruído de JPEG, carimbos, assinaturas)
    private static final int PAPER_LUMINANCE = 200;         // brilho mínimo para contar como papel branco
    private static final double MIN_PAPER_BORDER = 0.90;    // 90% da borda precisa ser papel
    private static final double BORDER_WIDTH = 0.05;        // borda = 5% de cada lado

    /** Imagem enviada em um formato que o ImageIO não consegue decodificar (ex.: HEIC, AVIF). */
    public static class UnsupportedImageFormatException extends RuntimeException {
        public UnsupportedImageFormatException(String message) {
            super(message);
        }
    }

    private static final int MAX_DIMENSION = 2048;

    private final U2NetBackgroundRemover u2NetBackgroundRemover;

    public SimulationService(U2NetBackgroundRemover u2NetBackgroundRemover) {
        this.u2NetBackgroundRemover = u2NetBackgroundRemover;
        // Garante que os plugins do TwelveMonkeys (WebP, JPEG CMYK) sejam registrados no ImageIO,
        // mesmo dentro do jar executável do Spring Boot, onde o registro automático pode falhar.
        ImageIO.scanForPlugins();
    }

    public byte[] removeBackground(MultipartFile image, RemovalMode mode) throws IOException, OrtException {

        byte[] bytes = image.getBytes();
        BufferedImage imgOriginal = ImageIO.read(new ByteArrayInputStream(bytes));
        if (imgOriginal == null) {
            String formato = detectFormat(bytes);
            System.err.println("===> [SIMULADOR] Formato de imagem não suportado: " + formato
                    + " (content-type informado: " + image.getContentType() + ")");
            throw new UnsupportedImageFormatException("Formato de imagem não suportado (" + formato
                    + "). Envie a referência em JPG, PNG ou WebP.");
        }

        BufferedImage imgReduzida = limitSize(imgOriginal);

        if (mode == RemovalMode.AUTO) {
            mode = isInkOnPaper(imgReduzida) ? RemovalMode.LINEART : RemovalMode.U2NET;
        }

        BufferedImage pngFinal = switch (mode) {
            case U2NET -> u2NetBackgroundRemover.removeBackground(imgReduzida);
            case LINEART -> removeLineArtBackground(imgReduzida);
            case AUTO -> throw new IllegalStateException("Modo AUTO deveria ter sido resolvido");
        };

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(pngFinal, "png", baos);

        return baos.toByteArray();
    }

    /**
     * Decide se a imagem é "tinta sobre papel" (desenho preto/cinza em fundo branco), caso em que
     * o LINEART funciona melhor que o U2Net: a U2Net foi treinada para destacar objetos em fotos,
     * perde traços finos na entrada de 320x320 e mantém o branco de dentro das formas fechadas.
     *
     * Critérios: quase nenhum pixel colorido E borda da imagem quase toda branca.
     * A amostragem pega pixels individuais (sem redimensionar), porque reduzir a imagem
     * borraria os traços finos em tons de cinza. Pixels transparentes não contam como papel,
     * então PNGs já recortados seguem para a U2Net, que respeita o alpha original.
     */
    static boolean isInkOnPaper(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        int step = Math.max(1, (int) Math.sqrt((double) width * height / SAMPLE_TARGET));
        int borderX = Math.max(1, (int) (width * BORDER_WIDTH));
        int borderY = Math.max(1, (int) (height * BORDER_WIDTH));

        long total = 0, colorful = 0, border = 0, paperBorder = 0;
        for (int y = 0; y < height; y += step) {
            for (int x = 0; x < width; x += step) {
                int argb = image.getRGB(x, y);
                int a = (argb >>> 24) & 0xFF;
                int r = (argb >> 16) & 0xFF;
                int g = (argb >> 8) & 0xFF;
                int b = argb & 0xFF;

                total++;
                if (Math.max(r, Math.max(g, b)) - Math.min(r, Math.min(g, b)) > COLOR_SATURATION) {
                    colorful++;
                }

                if (x < borderX || x >= width - borderX || y < borderY || y >= height - borderY) {
                    border++;
                    int luminance = (int) (0.299 * r + 0.587 * g + 0.114 * b);
                    if (a >= 250 && luminance >= PAPER_LUMINANCE) {
                        paperBorder++;
                    }
                }
            }
        }

        double colorFraction = (double) colorful / total;
        double paperBorderFraction = border == 0 ? 0 : (double) paperBorder / border;
        boolean inkOnPaper = colorFraction <= MAX_COLOR_FRACTION && paperBorderFraction >= MIN_PAPER_BORDER;

        System.out.printf("===> [SIMULADOR] Modo auto: %.1f%% pixels coloridos, %.1f%% da borda é papel -> %s%n",
                colorFraction * 100, paperBorderFraction * 100, inkOnPaper ? "LINEART" : "U2NET");
        return inkOnPaper;
    }

    /**
     * Identifica o formato pelos primeiros bytes do arquivo, só para dar uma mensagem de erro útil.
     * O app sempre envia "image/jpeg", então o content-type não é confiável.
     */
    private static String detectFormat(byte[] bytes) {
        if (bytes.length >= 12) {
            String riff = new String(bytes, 0, 4, StandardCharsets.US_ASCII);
            String webp = new String(bytes, 8, 4, StandardCharsets.US_ASCII);
            if ("RIFF".equals(riff) && "WEBP".equals(webp)) {
                return "WebP";
            }
            // Contêineres ISO BMFF (HEIC/HEIF/AVIF): "ftyp" nos bytes 4-7 seguido da marca
            if ("ftyp".equals(new String(bytes, 4, 4, StandardCharsets.US_ASCII))) {
                String brand = new String(bytes, 8, 4, StandardCharsets.US_ASCII);
                return brand.startsWith("avi") ? "AVIF" : "HEIC/HEIF (" + brand.trim() + ")";
            }
        }
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "JPEG";
        }
        if (bytes.length >= 4 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
            return "PNG";
        }
        return "desconhecido";
    }

    /**
     * Fotos de celular em qualidade máxima chegam com 12-50 MP. A referência é exibida pequena
     * sobre o corpo, então reduzimos o lado maior para MAX_DIMENSION: o processamento fica mais
     * rápido e o PNG devolvido não pesa dezenas de MB no app. A proporção é mantida.
     */
    private BufferedImage limitSize(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        int largest = Math.max(width, height);
        if (largest <= MAX_DIMENSION) {
            return image;
        }

        double factor = (double) MAX_DIMENSION / largest;
        int newWidth = Math.max(1, (int) Math.round(width * factor));
        int newHeight = Math.max(1, (int) Math.round(height * factor));
        System.out.println("===> [SIMULADOR] Reduzindo imagem de " + width + "x" + height + " para " + newWidth + "x" + newHeight);

        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_ARGB);
        java.awt.Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(java.awt.RenderingHints.KEY_RENDERING, java.awt.RenderingHints.VALUE_RENDER_QUALITY);
        g2d.drawImage(image, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        return resized;
    }

    private BufferedImage removeLineArtBackground(BufferedImage imgOriginal) {

        BufferedImage imgArgb = new BufferedImage(
            imgOriginal.getWidth(),
            imgOriginal.getHeight(),
            BufferedImage.TYPE_INT_ARGB
        );
        java.awt.Graphics2D g2d = imgArgb.createGraphics();
        g2d.drawImage(imgOriginal, 0, 0, null);
        g2d.dispose();

        Planar<GrayU8> imgRgba = new Planar<>(GrayU8.class, imgArgb.getWidth(), imgArgb.getHeight(), 4);
        ConvertBufferedImage.convertFrom(imgArgb, imgRgba, true);

        byte[] rBand = imgRgba.getBand(0).data;
        byte[] gBand = imgRgba.getBand(1).data;
        byte[] bBand = imgRgba.getBand(2).data;
        byte[] aBand = imgRgba.getBand(3).data;

        System.out.println("===> [SIMULADOR] Processando " + rBand.length + " pixels...");

        for (int i = 0; i < rBand.length; i++) {
            int r = rBand[i] & 0xFF;
            int g = gBand[i] & 0xFF;
            int b = bBand[i] & 0xFF;

            int brilho = (int) (0.299 * r + 0.587 * g + 0.114 * b);

            int novoAlpha = 255 - brilho;
            aBand[i] = (byte) novoAlpha;

            rBand[i] = 0;
            gBand[i] = 0;
            bBand[i] = 0;
        }

        return ConvertBufferedImage.convertTo(imgRgba, null, true);
    }
}
