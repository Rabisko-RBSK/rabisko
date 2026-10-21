import { Image } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { base64ToBytes } from './depthPng';

/** Imagem com URI (file://, http(s):// ou data:) e dimensões em pixels. */
export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
}

/** Imagem já no sistema de arquivos (`file://`), pronta para virar textura no expo-gl. */
export interface LocalImage {
  localUri: string;
  width: number;
  height: number;
}

/**
 * Lado maior máximo das imagens que entram na simulação. Fotos de celular chegam com 12-50 MP;
 * o limite de textura das GPUs móveis costuma ser 4096 px e o backend já reduz para 2048.
 */
export const MAX_IMAGE_SIDE = 2048;

/** Pasta de cache do simulador (fotos normalizadas, PNGs recortados, temporários de textura). */
export function diretorioSimulador(): Directory {
  const dir = new Directory(Paths.cache, 'simulador');
  if (!dir.exists) {
    dir.create({ idempotent: true });
  }
  return dir;
}

/** Apaga os arquivos do simulador (PNGs recortados, temporários). Seguro chamar a qualquer momento. */
export function limparCacheSimulador(): void {
  try {
    const dir = new Directory(Paths.cache, 'simulador');
    if (dir.exists) {
      dir.delete();
    }
  } catch (error) {
    console.warn('[Simulador] Falha ao limpar o cache:', error);
  }
}

export function salvarBytesEmCache(bytes: Uint8Array, nome: string): File {
  const file = new File(diretorioSimulador(), nome);
  file.write(bytes);
  return file;
}

export function medirImagem(uri: string): Promise<{ width: number; height: number }> {
  return Image.getSize(uri);
}

function nomeTemporario(extensao: string): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
}

/**
 * Garante que a imagem está num arquivo local (`file://`), que é o único tipo de origem que o
 * `texImage2D` do expo-gl lê. Data URIs são gravadas em cache e URLs http(s) são baixadas —
 * nesses casos `temporario` aponta para o arquivo criado, para o chamador apagar depois do upload
 * da textura. As dimensões são medidas quando não vêm informadas.
 */
export async function resolverImagemLocal(
  uri: string,
  size?: { width: number; height: number },
): Promise<{ image: LocalImage; temporario: File | null }> {
  let localUri = uri;
  let temporario: File | null = null;

  if (uri.startsWith('data:')) {
    const comma = uri.indexOf(',');
    if (comma < 0 || !/;base64/i.test(uri.slice(0, comma))) {
      throw new Error('Data URI de imagem precisa estar em base64');
    }
    const extensao = /^data:image\/png/i.test(uri) ? 'png' : 'jpg';
    temporario = salvarBytesEmCache(base64ToBytes(uri.slice(comma + 1)), nomeTemporario(extensao));
    localUri = temporario.uri;
  } else if (/^https?:\/\//i.test(uri)) {
    const extensao = /\.png(\?|$)/i.test(uri) ? 'png' : 'jpg';
    temporario = await File.downloadFileAsync(uri, new File(diretorioSimulador(), nomeTemporario(extensao)));
    localUri = temporario.uri;
  } else if (!uri.startsWith('file://')) {
    throw new Error(`URI de imagem não suportada pelo simulador: ${uri}`);
  }

  const dims = size ?? (await medirImagem(localUri));
  return { image: { localUri, width: dims.width, height: dims.height }, temporario };
}

/**
 * Reencoda a imagem como JPEG com o lado maior limitado a `maxSide`. Além de reduzir o upload e
 * a memória de textura, aplica a orientação EXIF: o decodificador nativo do expo-gl (stb_image)
 * ignora EXIF, então uma foto tirada em retrato apareceria deitada sem este passo.
 */
export async function normalizarImagem(
  uri: string,
  width: number,
  height: number,
  maxSide: number = MAX_IMAGE_SIDE,
): Promise<ImageInfo> {
  const context = ImageManipulator.manipulate(uri);
  try {
    if (Math.max(width, height) > maxSide) {
      context.resize(width >= height ? { width: maxSide } : { height: maxSide });
    }
    const rendered = await context.renderAsync();
    try {
      const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
      return { uri: result.uri, width: result.width, height: result.height };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
