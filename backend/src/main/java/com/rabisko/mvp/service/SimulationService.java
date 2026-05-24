package com.rabisko.mvp.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import boofcv.struct.image.GrayU8;
import boofcv.struct.image.Planar;
import boofcv.io.image.ConvertBufferedImage;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

/*
 * Service de processamento de imagem da simulação
 */

@Service
public class SimulationService {

    public byte[] removeBackground(MultipartFile image) throws IOException {

        // Lendo a imagem enviada pelo front-end
        BufferedImage imgOriginal = ImageIO.read(image.getInputStream());
        if (imgOriginal == null) {
            throw new RuntimeException("Não foi possível ler a imagem. Formato inválido.");
        }

        // Converter a imagem original para ARGB (garantindo que tenha 4 canais)
        // Isso evita erros do BoofCV caso a imagem seja um JPEG (3 canais RGB)
        BufferedImage imgArgb = new BufferedImage(imgOriginal.getWidth(), imgOriginal.getHeight(), BufferedImage.TYPE_INT_ARGB);
        java.awt.Graphics2D g2d = imgArgb.createGraphics();
        g2d.drawImage(imgOriginal, 0, 0, null);
        g2d.dispose();

        // Criando a estrutura BoofCV com 4 canais (RGBA) baseada na imagem ARGB
        Planar<GrayU8> imgRgba = new Planar<>(GrayU8.class, imgArgb.getWidth(), imgArgb.getHeight(), 4);
        ConvertBufferedImage.convertFrom(imgArgb, imgRgba, true);

        // Acessando os arrays de bytes diretamente para MUITO mais performance!
        byte[] rBand = imgRgba.getBand(0).data;
        byte[] gBand = imgRgba.getBand(1).data;
        byte[] bBand = imgRgba.getBand(2).data;
        byte[] aBand = imgRgba.getBand(3).data;

        System.out.println("===> [SIMULADOR] Processando " + rBand.length + " pixels...");

        for (int i = 0; i < rBand.length; i++) {
            // Lendo as cores do pixel diretamente (andando bit a bit)
            int r = rBand[i] & 0xFF;
            int g = gBand[i] & 0xFF;
            int b = bBand[i] & 0xFF;

            int brilho = (int) (0.299 * r + 0.587 * g + 0.114 * b);

            // Se brilho for 255 (branco), alpha vira 0 (100% transparente)
            // Se brilho for 0 (preto), alpha vira 255 (100% opaco)
            int novoAlpha = 255 - brilho;

            aBand[i] = (byte) novoAlpha;

            // Forçando os canais R, G e B para preto (0)
            rBand[i] = 0; // Red
            gBand[i] = 0; // Green
            bBand[i] = 0; // Blue
        }

        // Convertendo de volta para PNG e devolver!
        BufferedImage pngFinal = ConvertBufferedImage.convertTo(imgRgba, null, true);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(pngFinal, "png", baos);

        return baos.toByteArray();
    }
}
