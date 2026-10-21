/**
 * Matemática pura da colocação da tatuagem sobre a foto. Converte o estado dos gestos (pontos,
 * escala, graus) para o espaço que o fragment shader usa (`tattooShader.ts`): as convenções de
 * eixo daqui e do shader precisam andar juntas.
 */

/** Estado de manipulação da tatuagem, nas mesmas unidades dos gestos do RN. */
export interface TattooTransform {
  /** Deslocamento horizontal em pontos (dp) a partir do centro do canvas; positivo = direita. */
  x: number;
  /** Deslocamento vertical em pontos (dp) a partir do centro do canvas; positivo = baixo. */
  y: number;
  /** Multiplicador sobre o tamanho base (a arte cabe em metade da foto). */
  scale: number;
  /** Graus, sentido horário na tela. */
  rotation: number;
}

export const IDENTITY_TRANSFORM: TattooTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

/** Fração da foto (largura e altura) que a tatuagem ocupa com `scale = 1`, em modo "contain". */
export const TATTOO_BASE_FRACTION = 0.5;

/**
 * Colocação da tatuagem no espaço do shader: "unidades de altura da foto", x em [0, aspecto],
 * y em [0, 1] crescendo para cima.
 */
export interface TattooPlacement {
  center: [number, number];
  halfSize: [number, number];
  /** Radianos, sentido horário na tela. */
  rotation: number;
}

export function placeTattoo(
  transform: TattooTransform,
  photoAspect: number,
  tattooAspect: number,
  viewHeight: number,
): TattooPlacement {
  // 1 unidade = altura da foto = altura do canvas em pontos; o eixo y dos gestos aponta para baixo.
  const perPoint = viewHeight > 0 ? 1 / viewHeight : 0;
  const center: [number, number] = [photoAspect * 0.5 + transform.x * perPoint, 0.5 - transform.y * perPoint];

  // Mesma regra do overlay antigo: a arte cabe (contain) numa caixa de 50% x 50% da foto.
  const boxWidth = TATTOO_BASE_FRACTION * photoAspect;
  const boxHeight = TATTOO_BASE_FRACTION;
  let width: number;
  let height: number;
  if (tattooAspect >= boxWidth / boxHeight) {
    width = boxWidth;
    height = boxWidth / tattooAspect;
  } else {
    height = boxHeight;
    width = boxHeight * tattooAspect;
  }
  const scale = Math.max(transform.scale, 1e-4);

  return {
    center,
    halfSize: [(width * scale) / 2, (height * scale) / 2],
    rotation: (transform.rotation * Math.PI) / 180,
  };
}
