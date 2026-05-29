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

// =====================================================================
// SERVICE SimulationService — processa imagem da SIMULACAO de tatuagem.
//
// Ideia: o usuario fotografa um desenho preto-no-branco. A gente "remove
// o fundo branco" deixando so o traco preto com transparencia, pra que
// o app consiga sobrepor essa tattoo na foto da pele dele.
//
// Bibliotecas:
//   - ImageIO         : padrao do Java pra ler/escrever PNG/JPG
//   - BoofCV          : biblioteca de visao computacional (Computer Vision)
//                       que da estruturas Planar<GrayU8> pra trabalhar
//                       cada canal de cor por baixo
//   - BufferedImage   : tipo do Java pra representar imagens em memoria
//
// O algoritmo (simplificado):
//   1) Le a imagem que veio do upload
//   2) Converte pra ARGB (4 canais: alpha + RGB)
//   3) Pra cada pixel:
//        - calcula o BRILHO (formula padrao: 0.299*R + 0.587*G + 0.114*B)
//        - alpha = 255 - brilho  (preto -> opaco, branco -> transparente)
//        - forca R/G/B = 0       (so traço preto)
//   4) Devolve um PNG com transparencia
// =====================================================================

@Service
public class SimulationService {

    public byte[] removeBackground(MultipartFile image) throws IOException {

        // ----- 1) Le a imagem do upload -----
        BufferedImage imgOriginal = ImageIO.read(image.getInputStream());
        if (imgOriginal == null) {
            throw new RuntimeException("Não foi possível ler a imagem. Formato inválido.");
        }

        // ----- 2) Converte pra ARGB (4 canais) -----
        // JPEG so tem 3 canais (RGB). Pra ter ALPHA (transparencia), redesenhamos
        // num BufferedImage TYPE_INT_ARGB. Esse passo evita erro do BoofCV
        // quando recebe uma imagem com numero de canais diferente do esperado.
        BufferedImage imgArgb = new BufferedImage(
            imgOriginal.getWidth(),
            imgOriginal.getHeight(),
            BufferedImage.TYPE_INT_ARGB
        );
        java.awt.Graphics2D g2d = imgArgb.createGraphics();
        g2d.drawImage(imgOriginal, 0, 0, null);
        g2d.dispose();

        // ----- 3) Carrega na estrutura do BoofCV -----
        // Planar<GrayU8> = imagem com varios canais separados (1 array por canal).
        Planar<GrayU8> imgRgba = new Planar<>(GrayU8.class, imgArgb.getWidth(), imgArgb.getHeight(), 4);
        ConvertBufferedImage.convertFrom(imgArgb, imgRgba, true);

        // Acesso direto aos arrays de bytes — MUITO mais rapido do que getRGB()
        // pixel por pixel (que faz boxing/unboxing).
        byte[] rBand = imgRgba.getBand(0).data;    // canal vermelho
        byte[] gBand = imgRgba.getBand(1).data;    // canal verde
        byte[] bBand = imgRgba.getBand(2).data;    // canal azul
        byte[] aBand = imgRgba.getBand(3).data;    // canal alpha (transparencia)

        System.out.println("===> [SIMULADOR] Processando " + rBand.length + " pixels...");

        // ----- 4) Itera pixel a pixel -----
        for (int i = 0; i < rBand.length; i++) {
            // & 0xFF: byte em Java e SIGNED (-128..127). Esse truque converte
            // pra unsigned (0..255) que e o que esperamos pra cor.
            int r = rBand[i] & 0xFF;
            int g = gBand[i] & 0xFF;
            int b = bBand[i] & 0xFF;

            // Brilho percebido pelo olho humano (formula padrao W3C).
            int brilho = (int) (0.299 * r + 0.587 * g + 0.114 * b);

            // Inverte: pixel branco (brilho 255) vira transparente (alpha 0),
            //          pixel preto (brilho 0)   vira opaco (alpha 255).
            int novoAlpha = 255 - brilho;
            aBand[i] = (byte) novoAlpha;

            // Forca tudo pra preto — vai ficar so o traco da tattoo.
            rBand[i] = 0;
            gBand[i] = 0;
            bBand[i] = 0;
        }

        // ----- 5) Converte de volta pra PNG e devolve os bytes -----
        BufferedImage pngFinal = ConvertBufferedImage.convertTo(imgRgba, null, true);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(pngFinal, "png", baos);

        return baos.toByteArray();
    }
}
