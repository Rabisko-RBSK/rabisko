import * as THREE from 'three';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import type { DepthMap } from '../../utils/depthPng';
import type { LocalImage } from '../../utils/localImage';

/**
 * Textura a partir de um arquivo de imagem local. O expo-gl aceita como `pixels` do
 * `texImage2D`/`texSubImage2D` um objeto `{ localUri }` (file://) e decodifica em nativo com o
 * stb_image (sempre RGBA 8 bits); o three só usa `width`/`height` para reservar o `texStorage2D`,
 * por isso as dimensões precisam ser as reais do arquivo.
 */
export function createImageTexture(image: LocalImage): THREE.Texture {
  const texture = new THREE.Texture();
  texture.image = { localUri: image.localUri, width: image.width, height: image.height };
  texture.flipY = true;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  // O shader compõe em sRGB direto (como o Multiply do Photoshop); nada de conversão para linear.
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export type DepthPrecision = 'half-float' | 'byte';

export interface DepthTextureResult {
  texture: THREE.DataTexture;
  precision: DepthPrecision;
}

/**
 * Textura de um canal com o depth map. Primeiro tenta R16F (half float, filtrável no ES 3.0 /
 * WebGL2 sem extensão), que preserva ~11 bits de precisão — suficiente para as normais derivadas
 * não virarem curvas de nível. Se o driver recusar o upload (erro de GL), cai para R8.
 *
 * As linhas são invertidas aqui: o PNG vem de cima para baixo e a UV do plano cresce para cima.
 */
export function createDepthTexture(
  map: DepthMap,
  renderer: THREE.WebGLRenderer,
  gl: ExpoWebGLRenderingContext,
): DepthTextureResult {
  const { width, height, values } = map;

  const half = new Uint16Array(width * height);
  for (let y = 0; y < height; y++) {
    const source = (height - 1 - y) * width;
    const target = y * width;
    for (let x = 0; x < width; x++) {
      half[target + x] = THREE.DataUtils.toHalfFloat(values[source + x]);
    }
  }
  const halfTexture = configureDepthTexture(
    new THREE.DataTexture(half, width, height, THREE.RedFormat, THREE.HalfFloatType),
  );
  if (uploadSucceeded(halfTexture, renderer, gl)) {
    return { texture: halfTexture, precision: 'half-float' };
  }
  halfTexture.dispose();

  const bytes = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const source = (height - 1 - y) * width;
    const target = y * width;
    for (let x = 0; x < width; x++) {
      bytes[target + x] = Math.round(values[source + x] * 255);
    }
  }
  const byteTexture = configureDepthTexture(
    new THREE.DataTexture(bytes, width, height, THREE.RedFormat, THREE.UnsignedByteType),
  );
  renderer.initTexture(byteTexture);
  return { texture: byteTexture, precision: 'byte' };
}

function configureDepthTexture(texture: THREE.DataTexture): THREE.DataTexture {
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  // Linhas de 1 canal nem sempre são múltiplas de 4 bytes.
  texture.unpackAlignment = 1;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Sobe a textura agora e confere se o driver aceitou o formato. */
function uploadSucceeded(
  texture: THREE.Texture,
  renderer: THREE.WebGLRenderer,
  gl: ExpoWebGLRenderingContext,
): boolean {
  // Esvazia erros pendentes para não atribuir um erro antigo a este upload.
  for (let i = 0; i < 16 && gl.getError() !== gl.NO_ERROR; i++) {
    // nada
  }
  try {
    renderer.initTexture(texture);
  } catch {
    return false;
  }
  return gl.getError() === gl.NO_ERROR;
}
