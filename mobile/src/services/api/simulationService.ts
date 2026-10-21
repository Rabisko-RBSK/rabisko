import { File } from 'expo-file-system';
import api from './index';
import { decodeDepthPng, type DepthMap } from '../../utils/depthPng';

/**
 * Algoritmo de remoção de fundo do backend (`SimulationService.RemovalMode`): `auto` decide pela
 * imagem, `u2net` segmenta por IA (fotos, fundos complexos) e `lineart` usa o brilho (desenho em
 * papel branco).
 */
export type RemovalMode = 'auto' | 'u2net' | 'lineart';

/**
 * Monta o body multipart para um arquivo local (`file://`). O `as any` é o cast padrão do RN,
 * que aceita `{ uri, name, type }` mas não expõe isso no tipo `FormData` do DOM. O axios (XHR do
 * RN) é obrigatório aqui: o `fetch` do Expo rejeita essas partes.
 */
function multipartImage(uri: string, fieldName: string): FormData {
  const form = new FormData();
  const nome = uri.split('/').pop() || 'imagem.jpg';
  const ext = nome.split('.').pop()?.toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  form.append(fieldName, { uri, name: nome, type: mime } as any);
  return form;
}

export const simulationService = {
  /**
   * `POST /simulation/removebg`: devolve os bytes do PNG da referência com fundo transparente.
   * Timeout maior que o padrão da `api`: a U2Net leva alguns segundos por imagem.
   */
  async removerFundo(uri: string, mode: RemovalMode = 'auto'): Promise<Uint8Array> {
    const form = multipartImage(uri, 'image');
    form.append('mode', mode);
    const { data } = await api.post<ArrayBuffer>('/simulation/removebg', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return new Uint8Array(data);
  },

  /**
   * `POST /simulation/depthmap`: gera o mapa de profundidade da foto base com o Depth Anything V2
   * e já o decodifica (PNG cinza 16 bits → `Float32Array` em [0, 1], 1 = mais perto da câmera).
   */
  async gerarDepthMap(uri: string): Promise<DepthMap> {
    const form = multipartImage(uri, 'image');
    const { data } = await api.post<ArrayBuffer>('/simulation/depthmap', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'arraybuffer',
      timeout: 120000,
    });
    return decodeDepthPng(new Uint8Array(data));
  },

  /**
   * Carrega um depth map já gerado a partir de uma URL http(s) (ex.: simulação salva no backend)
   * ou de um arquivo local `file://`.
   */
  async carregarDepthMap(uri: string): Promise<DepthMap> {
    if (uri.startsWith('file://')) {
      return decodeDepthPng(await new File(uri).bytes());
    }
    const { data } = await api.get<ArrayBuffer>(uri, { responseType: 'arraybuffer', timeout: 60000 });
    return decodeDepthPng(new Uint8Array(data));
  },
};
