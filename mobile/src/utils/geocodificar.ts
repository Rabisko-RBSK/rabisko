import { Platform } from 'react-native';
import * as Location from 'expo-location';

import type { EnderecoInput } from '../services/api';

const TIMEOUT_MS = 8000;

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/**
 * Converte o endereço em coordenadas com o geocoder do próprio aparelho
 * (sem chave de API), para o artista/estúdio aparecer em "Perto de você".
 *
 * Nunca lança: qualquer falha (web, permissão negada, endereço não achado,
 * demora) devolve null e o cadastro segue sem coordenadas.
 */
export async function geocodificar(e: EnderecoInput): Promise<Coordenadas | null> {
  // geocodeAsync não existe na versão web do expo-location.
  if (Platform.OS === 'web') return null;

  try {
    // No Android o geocoder exige a permissão de localização.
    if (Platform.OS === 'android') {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        ({ status } = await Location.requestForegroundPermissionsAsync());
      }
      if (status !== 'granted') return null;
    }

    const texto = [
      [e.logradouro, e.numero && e.numero !== 'S/N' ? e.numero : null].filter(Boolean).join(', '),
      e.bairro,
      `${e.cidade} - ${e.uf}`,
      e.cep,
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');

    const resultados = await Promise.race([
      Location.geocodeAsync(texto),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);

    const primeiro = resultados?.[0];
    if (!primeiro) return null;
    return { latitude: primeiro.latitude, longitude: primeiro.longitude };
  } catch (err: any) {
    console.warn('[geocodificar] falha ao obter coordenadas', err?.message);
    return null;
  }
}
