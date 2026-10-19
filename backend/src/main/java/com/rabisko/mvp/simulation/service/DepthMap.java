package com.rabisko.mvp.simulation.service;

import java.awt.image.BufferedImage;
import java.awt.image.DataBufferUShort;

/**
 * Mapa de profundidade relativa da foto base, usado para simular o relevo da pele.
 *
 * {@code values} tem {@code width * height} valores em [0, 1], linha a linha a partir do canto
 * superior esquerdo: 1 = ponto mais perto da câmera, 0 = mais longe. É a mesma convenção de um
 * height map (claro = alto), então pode ir direto para um shader como textura de deslocamento ou
 * para o cálculo de normais. A escala é relativa à própria foto (normalização min-max), não é
 * uma distância em metros.
 *
 * A resolução é a de inferência da rede (~518 px no lado menor), não a da foto: o mapa cobre
 * exatamente o mesmo enquadramento, então deve ser amostrado pelas mesmas coordenadas UV da foto.
 */
public record DepthMap(int width, int height, float[] values) {

    public DepthMap {
        if (values.length != width * height) {
            throw new IllegalArgumentException("Esperado " + width * height + " valores, recebido " + values.length);
        }
    }

    /**
     * Imagem em tons de cinza de 16 bits (65536 níveis), sem perfil de cor/gama. Com só 8 bits as
     * normais derivadas do mapa viram curvas de nível visíveis na pele. Atenção no front: carregar
     * o PNG como {@code <img>}/textura comum reduz para 8 bits; é preciso decodificar o PNG mantendo
     * os 16 bits (ex.: fast-png ou UPNG.js) e enviar como textura float (R16F/R32F) ao WebGL.
     */
    public BufferedImage toGray16Image() {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_USHORT_GRAY);
        short[] pixels = ((DataBufferUShort) image.getRaster().getDataBuffer()).getData();
        for (int i = 0; i < values.length; i++) {
            pixels[i] = (short) Math.round(values[i] * 65535);
        }
        return image;
    }
}
