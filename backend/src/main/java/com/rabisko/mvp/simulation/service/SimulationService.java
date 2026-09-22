package com.rabisko.mvp.simulation.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import boofcv.struct.image.GrayU8;
import boofcv.struct.image.Planar;
import boofcv.io.image.ConvertBufferedImage;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;


@Service
public class SimulationService {

    public byte[] removeBackground(MultipartFile image) throws IOException {

        BufferedImage imgOriginal = ImageIO.read(image.getInputStream());
        if (imgOriginal == null) {
            throw new RuntimeException("Não foi possível ler a imagem. Formato inválido.");
        }

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

        BufferedImage pngFinal = ConvertBufferedImage.convertTo(imgRgba, null, true);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(pngFinal, "png", baos);

        return baos.toByteArray();
    }
}
