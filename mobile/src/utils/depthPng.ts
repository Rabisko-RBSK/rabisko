import { unzlibSync } from 'fflate';

/**
 * Mapa de profundidade relativa da foto base, espelho do record `DepthMap` do backend.
 *
 * `values` tem `width * height` valores em [0, 1], linha a linha a partir do canto superior
 * esquerdo: 1 = ponto mais perto da câmera, 0 = mais longe. A resolução é a da inferência do
 * Depth Anything (~518 px no lado menor), não a da foto — o mapa cobre o mesmo enquadramento,
 * então é amostrado pelas mesmas coordenadas UV da foto.
 */
export interface DepthMap {
  width: number;
  height: number;
  values: Float32Array;
  /** Profundidade de bits do PNG de origem. O backend manda 16; 8 serve de fallback. */
  bitDepth: 8 | 16;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Canais por pixel de cada `colorType` do PNG (3 = paleta não é suportado). */
const CHANNELS_BY_COLOR_TYPE: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

/**
 * Decodifica o PNG em tons de cinza de 16 bits devolvido por `POST /simulation/depthmap`.
 *
 * Carregar o PNG como textura comum (expo-gl / stb_image) reduz para 8 bits, e com só 256
 * níveis as normais derivadas do mapa viram curvas de nível visíveis na pele. Por isso o PNG é
 * decodificado aqui em JS mantendo os 16 bits, e vai para a GPU como textura float.
 *
 * Suporta PNG não entrelaçado com 8 ou 16 bits por amostra, nos tipos cinza, cinza+alpha, RGB e
 * RGBA (nos coloridos usa o primeiro canal). É tudo que o `ImageIO` do backend produz.
 */
export function decodeDepthPng(bytes: Uint8Array): DepthMap {
  if (bytes.length < 8 || PNG_SIGNATURE.some((byte, i) => bytes[i] !== byte)) {
    throw new Error('O mapa de profundidade não é um PNG válido');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let sawHeader = false;
  const idatChunks: Uint8Array[] = [];
  let idatLength = 0;

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const dataStart = offset + 8;
    if (dataStart + length > bytes.length) {
      throw new Error('PNG do mapa de profundidade truncado');
    }

    if (type === 'IHDR') {
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      interlace = bytes[dataStart + 12];
      sawHeader = true;
    } else if (type === 'IDAT') {
      idatChunks.push(bytes.subarray(dataStart, dataStart + length));
      idatLength += length;
    } else if (type === 'IEND') {
      break;
    }

    offset = dataStart + length + 4; // pula o CRC
  }

  if (!sawHeader || width === 0 || height === 0) {
    throw new Error('PNG do mapa de profundidade sem cabeçalho IHDR');
  }
  if (interlace !== 0) {
    throw new Error('PNG entrelaçado não é suportado no mapa de profundidade');
  }
  if (bitDepth !== 8 && bitDepth !== 16) {
    throw new Error(`PNG com ${bitDepth} bits por amostra não é suportado no mapa de profundidade`);
  }
  const channels = CHANNELS_BY_COLOR_TYPE[colorType];
  if (!channels) {
    throw new Error(`PNG com colorType ${colorType} não é suportado no mapa de profundidade`);
  }

  if (idatLength === 0) {
    throw new Error('PNG do mapa de profundidade sem dados de imagem (IDAT)');
  }

  const compressed = new Uint8Array(idatLength);
  let written = 0;
  for (const chunk of idatChunks) {
    compressed.set(chunk, written);
    written += chunk.length;
  }
  let raw: Uint8Array;
  try {
    raw = unzlibSync(compressed);
  } catch (error) {
    throw new Error(`Dados comprimidos do PNG do mapa de profundidade inválidos: ${String(error)}`);
  }

  const bytesPerPixel = channels * (bitDepth / 8);
  const stride = width * bytesPerPixel;
  if (raw.length < height * (stride + 1)) {
    throw new Error('Dados de imagem incompletos no PNG do mapa de profundidade');
  }

  const maxValue = bitDepth === 16 ? 65535 : 255;
  const values = new Float32Array(width * height);
  let previous = new Uint8Array(stride);
  let current = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const lineStart = y * (stride + 1);
    const filterType = raw[lineStart];
    const line = raw.subarray(lineStart + 1, lineStart + 1 + stride);
    unfilterScanline(filterType, line, previous, current, bytesPerPixel);

    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const index = x * bytesPerPixel;
      const sample = bitDepth === 16 ? (current[index] << 8) | current[index + 1] : current[index];
      values[rowOffset + x] = sample / maxValue;
    }

    const swap = previous;
    previous = current;
    current = swap;
  }

  return { width, height, values, bitDepth };
}

/** Desfaz o filtro de uma linha do PNG (spec PNG §9): None, Sub, Up, Average e Paeth. */
function unfilterScanline(
  filterType: number,
  line: Uint8Array,
  previous: Uint8Array,
  out: Uint8Array,
  bytesPerPixel: number,
): void {
  const length = line.length;
  switch (filterType) {
    case 0:
      out.set(line);
      break;
    case 1:
      for (let i = 0; i < length; i++) {
        const left = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0;
        out[i] = (line[i] + left) & 0xff;
      }
      break;
    case 2:
      for (let i = 0; i < length; i++) {
        out[i] = (line[i] + previous[i]) & 0xff;
      }
      break;
    case 3:
      for (let i = 0; i < length; i++) {
        const left = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0;
        out[i] = (line[i] + ((left + previous[i]) >> 1)) & 0xff;
      }
      break;
    case 4:
      for (let i = 0; i < length; i++) {
        const left = i >= bytesPerPixel ? out[i - bytesPerPixel] : 0;
        const up = previous[i];
        const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0;
        out[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
      }
      break;
    default:
      throw new Error(`Filtro PNG desconhecido: ${filterType}`);
  }
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const BASE64_LOOKUP = (() => {
  const table = new Uint8Array(256);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < alphabet.length; i++) table[alphabet.charCodeAt(i)] = i;
  table['-'.charCodeAt(0)] = 62; // variante URL-safe
  table['_'.charCodeAt(0)] = 63;
  return table;
})();

/**
 * Decodifica base64 (padrão ou URL-safe, com ou sem `=`) para bytes. Hermes expõe `atob`, mas
 * ele devolve string binária e precisaria de uma segunda passagem; aqui vai direto para bytes.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/\-_]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let written = 0;
  for (let i = 0; i < clean.length; i++) {
    buffer = (buffer << 6) | BASE64_LOOKUP[clean.charCodeAt(i)];
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = (buffer >> bits) & 0xff;
    }
  }
  return written === out.length ? out : out.subarray(0, written);
}
