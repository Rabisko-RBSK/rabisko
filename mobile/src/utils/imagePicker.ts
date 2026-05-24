import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Abre a galeria do dispositivo, pedindo permissão se necessário, e devolve
 * a URI da imagem escolhida (`file://...`). Retorna `null` se o usuário
 * cancelar ou negar a permissão.
 *
 * Quando a permissão é negada permanentemente (`canAskAgain === false`),
 * oferece abrir as configurações do app — caso contrário o usuário fica
 * preso sem poder reativar.
 */
export interface EscolherImagemOpts {
  /** Força recorte quadrado (1:1). Útil para fotos de avatar. */
  quadrada?: boolean;
}

export async function escolherImagemDaGaleria(
  opts: EscolherImagemOpts = {},
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    if (!perm.canAskAgain) {
      Alert.alert(
        'Permissão necessária',
        'Habilite o acesso à galeria nas configurações do app para escolher uma imagem.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ],
      );
    } else {
      Alert.alert(
        'Permissão negada',
        'Sem acesso à galeria não é possível escolher uma imagem.',
      );
    }
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: opts.quadrada ? [1, 1] : undefined,
    quality: 0.85,
  });

  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}
